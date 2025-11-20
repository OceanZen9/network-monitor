import psutil
import time
from collections import defaultdict
from extensions import socketio, db
import extensions as ext
from models import Traffic, Threshold
from flask import current_app

def check_and_notify_thresholds(rates):
    """
    Checks traffic rates against active thresholds and sends notifications.
    """
    try:
        active_thresholds = Threshold.query.filter_by(is_enabled=True).all()
        if not active_thresholds:
            return

        # Group thresholds by metric for efficient checking
        thresholds_by_metric = defaultdict(list)
        for t in active_thresholds:
            thresholds_by_metric[t.metric].append(t)

        for rate_info in rates:
            for metric, current_value in rate_info.items():
                if metric in thresholds_by_metric:
                    for threshold in thresholds_by_metric[metric]:
                        if current_value > threshold.value:
                            # Threshold breached, send notification to the user's room
                            message = (
                                f"Alert: {metric} on interface {rate_info.get('interface', 'N/A')} "
                                f"has exceeded the threshold. "
                                f"Current: {current_value:.2f}, Threshold: {threshold.value:.2f}"
                            )
                            socketio.emit(
                                'alert',
                                {'message': message, 'level': 'warning'},
                                room=threshold.user_id
                            )
                            # To avoid spamming, you might want to add a cooldown mechanism here
                            # For now, it notifies on every check where the threshold is exceeded.

    except Exception as e:
        current_app.logger.error(f"Error checking thresholds: {e}")


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
                # 1. Check for threshold breaches
                check_and_notify_thresholds(rates)

                # 2. Save to database
                for rate in rates:
                    traffic_entry = Traffic(
                        interface=rate['interface'],
                        bytes_sent=int(rate['bytes_sent_sec']),
                        bytes_recv=int(rate['bytes_recv_sec'])
                    )
                    db.session.add(traffic_entry)
                try:
                    db.session.commit()
                except Exception as e:
                    current_app.logger.error(f"Error saving traffic data to DB: {e}")
                    db.session.rollback()

                # 3. Emit traffic data via WebSocket
                socketio.emit('traffic_data', {'rates': rates})
            
            socketio.sleep(current_app.config.get('TRAFFIC_UPDATE_INTERVAL', 3))
