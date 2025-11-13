# app.py
# 位于 backend/app.py

from ipaddress import ip_address
import sys
from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import scapy.all as scapy

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

# 模块 5: 网络设备管理
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


# --- 4. 启动服务器 ---
if __name__ == '__main__':
    # 检查是否有管理员权限 (如果 scapy 需要的话)
    # (注意: Flask 开发服务器本身不需要 sudo，但 scapy 需要)
    print("--- Starting Flask Server (http://localhost:5000) ---")
    print("Note: Scapy sniffing may require 'sudo' to run this script later,")
    print("      but for now, the server is running.")
    
    app.run(debug=True, port=5000)