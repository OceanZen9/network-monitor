from extensions import socketio

from backend.services.packet_sniffer import monitor_packets_task
from backend.services.traffic_monitor import monitor_traffic_task

@socketio.on('connect')
def handle_connect():
    """
     当客户端连接时启动流量监控任务"""
    print('Client connected')
    global _traffic_monitoring_task, _packet_monitoring_task
    if not _traffic_monitoring_task:
        socketio.start_background_task(target=monitor_traffic_task)
        _traffic_monitoring_task = True
    if not _packet_monitoring_task:
        socketio.start_background_task(target=monitor_packets_task)
        _packet_monitoring_task = True

@socketio.on('disconnect')
def handle_disconnect():
    print("LOG: Client disconnected from WebSocket")
