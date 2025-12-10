import psutil
import time
from collections import defaultdict, deque
from extensions import socketio, db
import extensions as ext
from models import Traffic, Threshold
from flask import current_app
from services.alert_manager import AlertManager

# Cooldown period in seconds (e.g., 5 minutes)
ALERT_COOLDOWN_SECONDS = 300
WINDOW_SIZE_SECONDS = 30

# History storage: interface -> metric -> deque([(timestamp, value), ...])
_rate_history = defaultdict(lambda: defaultdict(deque))

def check_and_notify_thresholds(rates):
    """
    Checks traffic rates against active thresholds using a sliding window average.
    """
    try:
        active_thresholds = Threshold.query.filter_by(is_enabled=True).all()
        if not active_thresholds:
            return

        thresholds_by_metric = defaultdict(list)
        for t in active_thresholds:
            thresholds_by_metric[t.metric].append(t)

        current_time = time.time()

        for rate_info in rates:
            interface = rate_info.get('interface', 'unknown')
            
            # Update history and check thresholds for each metric present in rate_info
            for metric, current_value in rate_info.items():
                if metric == 'interface':
                    continue
                
                # 1. Update Sliding Window History
                history_queue = _rate_history[interface][metric]
                history_queue.append((current_time, current_value))
                
                # Remove old data points
                while history_queue and history_queue[0][0] < current_time - WINDOW_SIZE_SECONDS:
                    history_queue.popleft()
                
                # Calculate Average
                if not history_queue:
                    continue
                    
                total_value = sum(val for _, val in history_queue)
                average_value = total_value / len(history_queue)

                # 2. Check Thresholds against Average
                if metric in thresholds_by_metric:
                    for threshold in thresholds_by_metric[metric]:
                        # Check if average exceeds threshold
                        # AND we have enough data (optional: e.g. at least 5 seconds of data)
                        # For now, immediate check on average is fine as prolonged window builds up.
                        
                        if average_value > threshold.value:
                            last_alert_time = ext._alert_cooldowns.get(threshold.id, 0)
                            
                            if current_time - last_alert_time > ALERT_COOLDOWN_SECONDS:
                                # --- Threshold breached (Average) and not in cooldown ---
                                
                                message = (
                                    f"Bottleneck Detected: {metric} on {interface} "
                                    f"avg({WINDOW_SIZE_SECONDS}s): {average_value:.2f}, "
                                    f"Threshold: {threshold.value:.2f}"
                                )
                                
                                # Use AlertManager
                                # Determine level based on threshold or static for now
                                # If average > 2 * threshold, maybe ERROR? For now keep simple.
                                alert_level = 'error' if average_value > threshold.value * 2 else 'warning'
                                
                                AlertManager.send_alert(
                                    user_id=threshold.user_id,
                                    message=message,
                                    level=alert_level
                                )
                                
                                # Update cooldown
                                ext._alert_cooldowns[threshold.id] = current_time

    except Exception as e:
        current_app.logger.error(f"Error checking thresholds: {e}")
        # No rollback needed here as AlertManager handles its own session/flush if needed,
        # but the main loop handles the commit.

def get_traffic_rates():
    """
    A helper function to calculate per-second byte rates.
    """
    current_counters = psutil.net_io_counters(pernic=True)
    current_time = time.time()

    rates = []
    
    if not ext._last_io_counters:
        ext._last_io_counters = {"time": current_time, "counters": current_counters}
        return []

    prev_time = ext._last_io_counters["time"]
    prev_counters = ext._last_io_counters["counters"]

    time_diff = current_time - prev_time
    if time_diff == 0:
        return [] # Avoid division by zero

    for if_name, current_status in current_counters.items():
        if if_name in prev_counters and if_name != "lo0":
            prev_status = prev_counters[if_name]
            bytes_sent_rate = (current_status.bytes_sent - prev_status.bytes_sent) / time_diff
            bytes_recv_rate = (current_status.bytes_recv - prev_status.bytes_recv) / time_diff
            
            rates.append({
                "interface": if_name,
                "bytes_sent_sec": round(bytes_sent_rate, 2),
                "bytes_recv_sec": round(bytes_recv_rate, 2)
            })
    
    ext._last_io_counters = {"time": current_time, "counters": current_counters}
    return rates

def monitor_traffic_task(app):
    """
    A background task that periodically fetches traffic data, saves it,
    checks thresholds, and sends data via WebSocket.
    """
    with app.app_context():
        while True:
            rates = get_traffic_rates()
            if rates:
                # 1. Check for bottleneck/threshold breaches
                check_and_notify_thresholds(rates)

                # 2. Save traffic data to database
                for rate in rates:
                    traffic_entry = Traffic(
                        interface=rate['interface'],
                        bytes_sent=int(rate['bytes_sent_sec']),
                        bytes_recv=int(rate['bytes_recv_sec'])
                    )
                    db.session.add(traffic_entry)
                
                try:
                    # Commit both traffic data and any newly created alerts (from AlertManager)
                    db.session.commit()
                except Exception as e:
                    current_app.logger.error(f"Error saving data to DB: {e}")
                    db.session.rollback()

                # 3. Emit traffic data via WebSocket
                socketio.emit('traffic_data', {'rates': rates})
            
            socketio.sleep(current_app.config.get('TRAFFIC_UPDATE_INTERVAL', 3))
