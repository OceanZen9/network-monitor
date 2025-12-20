"""
流量监控服务模块
负责后台监控网络流量，计算速率，检查阈值并在超出阈值时发送告警。
"""
import time
from collections import defaultdict, deque
import psutil
from flask import current_app
from extensions import socketio, db
import extensions as ext
from models import Traffic, Threshold
from services.alert_manager import AlertManager

# 冷却时间（秒）（例如：5分钟）
ALERT_COOLDOWN_SECONDS = 300
WINDOW_SIZE_SECONDS = 30

# 历史记录存储: interface -> metric -> deque([(timestamp, value), ...])
_rate_history = defaultdict(lambda: defaultdict(deque))

def _check_single_threshold(interface, metric, average_value, threshold):
    """
    检查单个阈值是否被突破，如果是则发送告警。
    """
    if average_value <= threshold.value:
        return

    # pylint: disable=protected-access
    last_alert_time = ext._alert_cooldowns.get(threshold.id, 0)
    current_time = time.time()

    if current_time - last_alert_time <= ALERT_COOLDOWN_SECONDS:
        return

    # --- 阈值突破 (平均值) 且不在冷却期 ---
    message = (
        f"检测到瓶颈: {interface} 上的 {metric} "
        f"平均({WINDOW_SIZE_SECONDS}s): {average_value:.2f}, "
        f"阈值: {threshold.value:.2f}"
    )

    # 如果平均值 > 2 * 阈值，也许是 ERROR
    alert_level = 'error' if average_value > threshold.value * 2 else 'warning'

    AlertManager.send_alert(
        user_id=threshold.user_id,
        message=message,
        level=alert_level
    )

    # 更新冷却时间
    ext._alert_cooldowns[threshold.id] = current_time


def check_and_notify_thresholds(rates):
    """
    使用滑动窗口平均值检查流量速率是否超过活动阈值。
    """
    try:
        active_thresholds = Threshold.query.filter_by(is_enabled=True).all()
        if not active_thresholds:
            return

        thresholds_by_metric = defaultdict(list)
        for t in active_thresholds:
            thresholds_by_metric[t.metric].append(t)

        current_time = time.time()

        for rate_info in rates:
            interface = rate_info.get('interface', 'unknown')

            # 更新历史并检查 rate_info 中存在的每个指标的阈值
            for metric, current_value in rate_info.items():
                if metric == 'interface':
                    continue

                # 1. 更新滑动窗口历史
                history_queue = _rate_history[interface][metric]
                history_queue.append((current_time, current_value))

                # 移除旧数据点
                while history_queue and history_queue[0][0] < current_time - WINDOW_SIZE_SECONDS:
                    history_queue.popleft()

                # 计算平均值
                if not history_queue:
                    continue

                total_value = sum(val for _, val in history_queue)
                average_value = total_value / len(history_queue)

                # 2. 对比平均值与阈值
                if metric in thresholds_by_metric:
                    for threshold in thresholds_by_metric[metric]:
                        _check_single_threshold(interface, metric, average_value, threshold)

    except Exception as e: # pylint: disable=broad-exception-caught
        current_app.logger.error(f"检查阈值时出错: {e}")


def get_traffic_rates():
    """
    计算每秒字节速率的辅助函数。
    """
    current_counters = psutil.net_io_counters(pernic=True)
    current_time = time.time()

    rates = []

    # pylint: disable=protected-access
    if not ext._last_io_counters:
        ext._last_io_counters = {"time": current_time, "counters": current_counters}
        return []

    prev_time = ext._last_io_counters["time"]
    prev_counters = ext._last_io_counters["counters"]

    time_diff = current_time - prev_time
    if time_diff == 0:
        return [] # 避免除以零

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

    ext._last_io_counters = {"time": current_time, "counters": current_counters}
    return rates

def monitor_traffic_task(app):
    """
    后台任务，定期获取流量数据，保存数据，
    检查阈值，并通过WebSocket发送数据。
    """
    with app.app_context():
        while True:
            rates = get_traffic_rates()
            if rates:
                # 1. 检查瓶颈/阈值突破
                check_and_notify_thresholds(rates)

                # 2. 保存流量数据到数据库
                for rate in rates:
                    traffic_entry = Traffic(
                        interface=rate['interface'],
                        bytes_sent=int(rate['bytes_sent_sec']),
                        bytes_recv=int(rate['bytes_recv_sec'])
                    )
                    db.session.add(traffic_entry)

                try:
                    # 提交流量数据和任何新创建的告警（来自AlertManager）
                    db.session.commit()
                except Exception as e: # pylint: disable=broad-exception-caught
                    current_app.logger.error(f"保存数据到数据库时出错: {e}")
                    db.session.rollback()

                # 3. 通过WebSocket发送流量数据
                socketio.emit('traffic_data', {'rates': rates})

            socketio.sleep(current_app.config.get('TRAFFIC_UPDATE_INTERVAL', 3))
