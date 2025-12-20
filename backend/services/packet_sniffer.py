"""
数据包嗅探服务模块
负责捕获网络数据包，分析协议，并通过WebSocket实时推送数据。
"""
from collections import defaultdict
import scapy.all as scapy
from extensions import socketio
import extensions as ext

# pylint: disable=no-member
# pylint: disable=protected-access

# 在 ext 中初始化 _protocol_counts
ext._protocol_counts = defaultdict(int)

def get_protocol_name(packet):
    """从数据包中提取协议名称"""
    if packet.haslayer(scapy.TCP):
        return "TCP"
    if packet.haslayer(scapy.UDP):
        return "UDP"
    if packet.haslayer(scapy.ICMP):
        return "ICMP"
    if packet.haslayer(scapy.ARP):
        return "ARP"
    return "Other"

def packet_callback(packet):
    """数据包回调函数 - 更新协议计数"""
    ext._packet_count += 1
    protocol = get_protocol_name(packet)
    ext._protocol_counts[protocol] += 1

    try:
        summary = packet.summary()
        if summary:
            if ext._packet_count % ext._packet_print_interval == 0:
                print(f"📦 已捕获 {ext._packet_count} 个数据包 (最新: {summary[:50]}...)")
            socketio.emit('new_packet', {'summary': summary})
    except Exception: # pylint: disable=broad-exception-caught
        # 减少不必要的日志
        pass

def send_protocol_counts_task():
    """定期发送协议计数到前端"""
    while True:
        # 创建一个副本以避免在迭代期间修改
        counts_copy = dict(ext._protocol_counts)
        total_packets = sum(counts_copy.values())

        if total_packets > 0:
            # 计算百分比
            percentages = {p: (c / total_packets) * 100 for p, c in counts_copy.items()}
            socketio.emit('protocol_counts', {
                'counts': counts_copy,
                'percentages': percentages,
                'total': total_packets
            })

        socketio.sleep(3) # 每3秒发送一次

def monitor_packets_task():
    """
    一个后台任务，用于捕获网络数据包并调用回调函数。
    """
    try:
        # 启动发送协议计数的后台任务
        socketio.start_background_task(send_protocol_counts_task)
        # 开始嗅探
        scapy.sniff(prn=packet_callback, store=False)
    except Exception as e: # pylint: disable=broad-exception-caught
        error_msg = str(e)
        print(f"数据包嗅探出错: {error_msg}")
        socketio.emit('sniffer_error', {'error': f"嗅探失败: {error_msg}"})
        if "Permission denied" in error_msg:
            socketio.emit('sniffer_error', {'error': "权限被拒绝: 请使用 'sudo' 运行后端"})
