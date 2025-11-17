# app.py
# 位于 backend/app.py

import glob
from ipaddress import ip_address
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import scapy.all as scapy
import time
from flask_socketio import SocketIO, emit

# --- 1. 初始化 Flask ---
app = Flask(__name__)

# --- 2. 配置 CORS (关键) ---
# 允许来自你 Vite 开发服务器 (http://localhost:5173) 的请求
CORS(app, origins="http://localhost:5173", supports_credentials=True)

# --- 配置SocketIO ---
socketio = SocketIO(app, cors_allowed_origins="http://localhost:5173")

# --- 用于存储上次流量数据的全局变量 ---
_last_io_counters = {}

# --- 3. 我们的“降维”模块 API ---

# 模块 1: 网络数据包分析 (核心)
# (我们先用“假数据”打通链路)
@app.route("/api/start-sniffing")
def api_start_sniffing():
    print("LOG: /api/start-sniffing was hit")
    real_summary = []
    try:
        packets = scapy.sniff(count = 5, timeout = 5)

        for pkt in packets:
            real_summary.append(pkt.summary())

        return jsonify({
            "status": "Sniffing complete",
            "packets_found": len(packets),
            "summary": real_summary
        })
    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({
            "error": "Sniffing failed. Did you run with 'sudo'?",
            "details": str(e)
        }), 500

# 模块 2: 网络设备管理
@app.route("/api/devices")
def api_get_devices():
    print("LOG: /api/devices was hit")
    all_interfaces = psutil.net_if_addrs()
    real_devices = []

    for if_name, addresses in all_interfaces.items():
        ip_address = None
        for addr in addresses:
            if addr.family == 2:
                ip_address = addr.address
                break
        
        if ip_address and if_name != "lo0":
            real_devices.append({
                "id": if_name,
                "name": f"{if_name} Interface", # (一个简单的名字)
                "ip": ip_address
            })

    return jsonify(real_devices)

# --- 模块 3: 用户登录模拟 ---
@app.route("/api/login", methods=["POST"])
def api_login():
    print("LOG: /api/login was hit")
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if username == "admin" and password == "123456":
        return jsonify({
            "message": "Login successful",
            "user": {"username": "admin", "role": "admin"},
            "token": "fake-jwt-token-for-admin-user"
        })
    else:
        return jsonify({"error": "Invalid username or password"}), 401
    
# --- 模块 4: 实时流量监控 via WebSocket ---
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
        socketio.sleep(1)  # 每 1 秒更新一次

@socketio.on('connect')
def handle_connect():
    """
     当客户端连接时启动流量监控任务"""
    print('Client connected')
    socketio.start_background_task(target=monitor_traffic_task)

@socketio.on('disconnect')
def handle_disconnect():
    print("LOG: Client disconnected from WebSocket")

# --- 启动服务器 ---
if __name__ == '__main__':
    # 检查是否有管理员权限 (如果 scapy 需要的话)
    # (注意: Flask 开发服务器本身不需要 sudo，但 scapy 需要)
    print("--- Starting Flask Server (http://localhost:5000) ---")
    print("Note: Scapy sniffing may require 'sudo' to run this script later,")
    print("      but for now, the server is running.")
    
    socketio.run(app, debug=True, port=5000)