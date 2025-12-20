"""
设备路由模块
提供获取网络接口设备列表、详情和统计信息的接口。
"""
import psutil
from flask import Blueprint, jsonify

devices_bp = Blueprint('devices', __name__)

@devices_bp.route('/', methods=['GET'], strict_slashes=False)
def api_get_devices():
    """获取所有网络设备列表"""
    # print("日志: 访问 /api/devices")
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
                "name": f"{if_name} 接口", # (一个简单的名字)
                "ip": ip_address
            })

    return jsonify(real_devices)

@devices_bp.route('/<device_id>', methods=['GET'])
def get_device_detail(device_id):
    """获取特定设备详情"""
    try:
        stats = psutil.net_if_stats()
        addrs = psutil.net_if_addrs()

        if device_id not in stats:
            return jsonify({"error": "未找到设备"}), 404

        device_stat = stats[device_id]
        device_addrs = addrs.get(device_id, [])

        ip_address = "N/A"
        for addr in device_addrs:
            if addr.family == 2: # AF_INET
                ip_address = addr.address
                break

        return jsonify({
            "id": device_id,
            "name": device_id,
            "ip": ip_address,
            "is_up": device_stat.isup,
            "speed": device_stat.speed,
            "mtu": device_stat.mtu,
            "duplex": device_stat.duplex
        })
    except Exception as e: # pylint: disable=broad-exception-caught
        return jsonify({"error": str(e)}), 500

@devices_bp.route('/<device_id>/stats', methods=['GET'])
def get_device_stats(device_id):
    """获取设备统计信息"""
    try:
        io_counters = psutil.net_io_counters(pernic=True)

        if device_id not in io_counters:
            return jsonify({"error": "未找到设备"}), 404

        counters = io_counters[device_id]

        return jsonify({
            "device_id": device_id,
            "stats": {
                "bytes_sent": counters.bytes_sent,
                "bytes_recv": counters.bytes_recv,
                "packets_sent": counters.packets_sent,
                "packets_recv": counters.packets_recv,
                "errin": counters.errin,
                "errout": counters.errout,
                "dropin": counters.dropin,
                "dropout": counters.dropout
            }
        })
    except Exception as e: # pylint: disable=broad-exception-caught
        return jsonify({"error": str(e)}), 500
