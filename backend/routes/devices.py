from flask import Blueprint, jsonify
import psutil

devices_bp = Blueprint('devices', __name__)

@devices_bp.route('/', methods=['GET'])
def api_get_devices():
    """获取所有网络设备列表"""
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

@devices_bp.route('/<device_id>', methods=['GET'])
def get_device_detail(device_id):
    """获取特定设备详情"""
    # TODO: 实现设备详情获取
    return jsonify({"device_id": device_id, "status": "coming soon"}), 501


@devices_bp.route('/<device_id>/stats', methods=['GET'])
def get_device_stats(device_id):
    """获取设备统计信息"""
    # TODO: 实现设备统计
    return jsonify({"device_id": device_id, "stats": {}}), 501