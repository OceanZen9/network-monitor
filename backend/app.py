# app.py
# 位于 backend/app.py

import sys
from flask import Flask, jsonify
from flask_cors import CORS 

# --- 1. 初始化 Flask ---
app = Flask(__name__)

# --- 2. 配置 CORS (关键) ---
# 允许来自你 Vite 开发服务器 (http://localhost:5173) 的请求
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# --- 3. 我们的“降维”模块 API ---

# 模块 0: 一个简单的测试 API
@app.route("/api/test")
def api_test():
    print("LOG: /api/test endpoint was hit")
    return jsonify({"message": "Hello from Python Backend!"})

# 模块 1: 网络数据包分析 (核心)
# (我们先用“假数据”打通链路)
@app.route("/api/start-sniffing")
def api_start_sniffing():
    print("LOG: /api/start-sniffing was hit")
    # TODO: 在这里加入 scapy 的真实抓包逻辑
    
    # "降维"的假数据：
    fake_data = {
        "status": "Sniffing complete",
        "packets_found": 5,
        "summary": [
            "192.168.1.1 -> 8.8.8.8 TCP",
            "192.168.1.1 -> 1.1.1.1 UDP",
        ]
    }
    return jsonify(fake_data)

# 模块 5: 网络设备管理
@app.route("/api/devices")
def api_get_devices():
    print("LOG: /api/devices was hit")
    # TODO: 在这里加入 psutil 的真实逻辑
    
    # "降维"的假数据：
    fake_devices = [
        {"id": "en0", "name": "Wi-Fi (en0)", "ip": "192.168.1.10"},
        {"id": "eth0", "name": "Ethernet (eth0)", "ip": "Not Connected"},
    ]
    return jsonify(fake_devices)


# --- 4. 启动服务器 ---
if __name__ == '__main__':
    # 检查是否有管理员权限 (如果 scapy 需要的话)
    # (注意: Flask 开发服务器本身不需要 sudo，但 scapy 需要)
    print("--- Starting Flask Server (http://localhost:5000) ---")
    print("Note: Scapy sniffing may require 'sudo' to run this script later,")
    print("      but for now, the server is running.")
    
    app.run(debug=True, port=5000)