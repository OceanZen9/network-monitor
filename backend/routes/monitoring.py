from extensions import socketio
import extensions as ext

from services.packet_sniffer import monitor_packets_task
from services.traffic_monitor import monitor_traffic_task

@socketio.on('connect')
def handle_connect(auth=None):
    """
     当客户端连接时启动流量监控任务"""
    print(f'Client connected. Auth: {auth}')
    
    if not ext._traffic_monitoring_task:
        socketio.start_background_task(target=monitor_traffic_task)
        ext._traffic_monitoring_task = True
    if not ext._packet_monitoring_task:
        socketio.start_background_task(target=monitor_packets_task)
        ext._packet_monitoring_task = True

@socketio.on('disconnect')
def handle_disconnect():
    print("LOG: Client disconnected from WebSocket")
