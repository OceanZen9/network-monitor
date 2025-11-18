import psutil
import time
from extensions import socketio, _last_io_counters

def get_traffic_rates():
    """
    一个辅助函数，用于计算每秒的字节速率。
    它会与全局的 _last_io_counters 进行比较
    """
    global _last_io_counters
    current_counters = psutil.net_io_counters(pernic=True)
    current_time = time.time()

    rates = []
    
    if not _last_io_counters:
        _last_io_counters = {"time": current_time, "counters": current_counters}
        return []  # 第一次调用时没有速率数据
    
    prev_time = _last_io_counters["time"]
    prev_counters = _last_io_counters["counters"]

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
    
    _last_io_counters = {"time": current_time, "counters": current_counters}
    return rates

def monitor_traffic_task():
    """
    一个后台任务，定期获取流量数据并通过 WebSocket 发送给客户端
    """
    while True:
        rates = get_traffic_rates()
        if rates:
            socketio.emit('traffic_data', {'rates': rates})
        socketio.sleep(3)  # 每 1 秒更新一次
