import scapy.all as scapy
import extensions as ext
from extensions import socketio
from extensions import _packet_count, _packet_print_interval

def packet_callback(packet):
    """数据包回调函数 - 减少日志输出"""
    ext._packet_count += 1
    
    try:
        summary = packet.summary()
        if summary:
            # ✅ 只每隔 N 个包打印一次，避免刷屏
            if ext._packet_count % ext._packet_print_interval == 0:
                print(f"📦 Captured {ext._packet_count} packets (latest: {summary[:50]}...)")
            # 但仍然发送所有包到前端
            socketio.emit('new_packet', {'summary': summary})
    except Exception as e:
        pass

def monitor_packets_task():
    """
    一个后台任务，用于捕获网络数据包并调用回调函数。
    """
    try:
        scapy.sniff(prn=packet_callback, store=False)
    except Exception as e:
        print(f"Error in packet sniffing: {e}")
