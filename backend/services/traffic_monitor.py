import psutil
import time
from extensions import socketio, db
import extensions as ext
from models import Traffic
from flask import current_app

def get_traffic_rates():
    """
    一个辅助函数，用于计算每秒的字节速率。
    它会与全局的 ext._last_io_counters 进行比较
    """
    current_counters = psutil.net_io_counters(pernic=True)
    current_time = time.time()

    rates = []
    
    if not ext._last_io_counters:
        ext._last_io_counters = {"time": current_time, "counters": current_counters}
        return []  # 第一次调用时没有速率数据
    
    prev_time = ext._last_io_counters["time"]
    prev_counters = ext._last_io_counters["counters"]

    time_diff = current_time - prev_time
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

def monitor_traffic_task(app): # accept app as argument
    """
    一个后台任务，定期获取流量数据并通过 WebSocket 发送给客户端，并保存到数据库
    """
    with app.app_context(): # Ensure we are in application context for DB operations
        while True:
            rates = get_traffic_rates()
            if rates:
                # Save to database
                for rate in rates:
                    traffic_entry = Traffic(
                        interface=rate['interface'],
                        bytes_sent=int(rate['bytes_sent_sec']), # Store as int
                        bytes_recv=int(rate['bytes_recv_sec'])  # Store as int
                    )
                    db.session.add(traffic_entry)
                try:
                    db.session.commit()
                except Exception as e:
                    current_app.logger.error(f"Error saving traffic data to DB: {e}")
                    db.session.rollback() # Rollback on error

                # Emit via WebSocket
                socketio.emit('traffic_data', {'rates': rates})
            socketio.sleep(current_app.config.get('TRAFFIC_UPDATE_INTERVAL', 3)) # Use config for interval
