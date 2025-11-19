# backend/extensions.py
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# 初始化扩展（不绑定到app）
socketio = SocketIO()
cors = CORS()
db = SQLAlchemy()
jwt = JWTManager()

# 全局变量
_last_io_counters = {}
_traffic_monitoring_task = None
_packet_monitoring_task = None
_packet_count = 0
_packet_print_interval = 100