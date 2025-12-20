"""
监控路由模块
处理WebSocket连接和流量/数据包监控任务的启动。
"""
from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import decode_token, jwt_required
from flask_socketio import join_room
from extensions import socketio
import extensions as ext

from services.packet_sniffer import monitor_packets_task
from services.traffic_monitor import monitor_traffic_task

monitoring_bp = Blueprint('monitoring', __name__)

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
            print(f"客户端已连接并加入房间: {user_id}")
        except Exception as e: # pylint: disable=broad-exception-caught
            print(f"Socket.IO 认证错误: {e}")
            # 可选: 如果认证失败，断开客户端连接
            # return False
    else:
        print("客户端连接未携带认证信息。")

    # 启动后台监控任务（如果尚未启动）
    # pylint: disable=protected-access
    if not ext._traffic_monitoring_task:
        print("正在启动流量监控任务。")
        socketio.start_background_task(
            target=monitor_traffic_task,
            app=current_app._get_current_object()
        )
        ext._traffic_monitoring_task = True
    if not ext._packet_monitoring_task:
        print("正在启动数据包嗅探任务。")
        socketio.start_background_task(target=monitor_packets_task)
        ext._packet_monitoring_task = True


@monitoring_bp.route('/data')
@jwt_required()
def get_data():
    """获取初始数据"""
    # 确保任务正在运行
    # pylint: disable=protected-access
    if not ext._traffic_monitoring_task:
        print("正在启动流量监控任务。")
        socketio.start_background_task(
            target=monitor_traffic_task,
            app=current_app._get_current_object()
        )
        ext._traffic_monitoring_task = True
    if not ext._packet_monitoring_task:
        print("正在启动数据包嗅探任务。")
        socketio.start_background_task(target=monitor_packets_task)
        ext._packet_monitoring_task = True

    return jsonify({"status": "monitoring_active"})

@socketio.on('disconnect')
def handle_disconnect():
    """
    当客户端断开连接时触发。
    """
    # 'leave_room' 在断开连接时不是必须的，因为房间会自动清理，
    # 但如果需要可以显式调用。
    print("日志: 客户端已断开WebSocket连接")
