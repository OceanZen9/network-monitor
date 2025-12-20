"""
告警管理服务模块
负责告警的发送、保存和WebSocket推送。
"""
from datetime import datetime
from flask import current_app
from extensions import db, socketio
from models import Alert

class AlertManager:
    """告警管理器类"""
    # pylint: disable=too-few-public-methods
    @staticmethod
    def send_alert(user_id, message, level='warning'):
        """
        发送告警:
        1. 保存到数据库
        2. 通过WebSocket推送
        3. (预留) 记录高严重性告警日志，未来可集成邮件/短信通知
        """
        try:
            # 1. 保存到数据库
            new_alert = Alert(
                user_id=user_id,
                message=message,
                level=level
            )
            db.session.add(new_alert)
            # 注意: 提交通常由调用者(如traffic_monitor任务)处理以进行批量更新，
            # 但如果这是独立调用的，我们可能需要提交。
            # 目前，我们假设调用者处理会话或我们进行flush。
            db.session.flush()

            # 2. 通过WebSocket推送
            socketio.emit(
                'alert',
                {'message': message, 'level': level, 'timestamp': datetime.now().isoformat()},
                room=user_id
            )

            # 3. 处理高严重性 (Level=Error)
            if level.lower() == 'error':
                AlertManager._handle_critical_alert(user_id, message)

        except Exception as e: # pylint: disable=broad-exception-caught
            current_app.logger.error(f"AlertManager发生错误: {e}")

    @staticmethod
    def _handle_critical_alert(user_id, message):
        """
        预留用于外部通知 (邮件, 短信, PagerDuty)。
        目前仅记录 CRITICAL 日志。
        """
        current_app.logger.critical(f"用户 {user_id} 的严重告警: {message}")
        # TODO: 在此处集成邮件/短信服务
        # 例如: send_email(user_email, "严重网络告警", message)
