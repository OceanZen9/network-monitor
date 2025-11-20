from flask import current_app, request
from flask_jwt_extended import decode_token
from flask_socketio import join_room
from extensions import socketio
import extensions as ext

from services.packet_sniffer import monitor_packets_task
from services.traffic_monitor import monitor_traffic_task

@socketio.on('connect')
def handle_connect(auth=None):
    """
    当客户端连接时，验证用户身份并将其加入私有房间，然后启动监控任务。
    """
    user_id = None
    if auth and 'token' in auth:
        try:
            # 验证JWT令牌并获取用户ID
            token = auth['token'].split(' ')[1] if ' ' in auth['token'] else auth['token']
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            # 将客户端加入以其user_id命名的房间
            join_room(user_id)
            print(f"Client connected and joined room: {user_id}")
        except Exception as e:
            print(f"Socket.IO Auth Error: {e}")
            # Optionally, you can disconnect the client if auth fails
            # return False 
    else:
        print("Client connected without authentication.")

    # 启动后台监控任务（如果尚未启动）
    if not ext._traffic_monitoring_task:
        print("Starting traffic monitoring task.")
        socketio.start_background_task(target=monitor_traffic_task, app=current_app._get_current_object())
        ext._traffic_monitoring_task = True
    if not ext._packet_monitoring_task:
        print("Starting packet sniffing task.")
        socketio.start_background_task(target=monitor_packets_task)
        ext._packet_monitoring_task = True


@socketio.on('disconnect')
def handle_disconnect():
    # 'leave_room' is not strictly necessary on disconnect, as rooms are cleaned up,
    # but it can be explicit if needed.
    print("LOG: Client disconnected from WebSocket")
