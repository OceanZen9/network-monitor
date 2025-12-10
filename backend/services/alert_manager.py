from extensions import db, socketio
from models import Alert
from datetime import datetime
from flask import current_app

class AlertManager:
    @staticmethod
    def send_alert(user_id, message, level='warning'):
        """
        Sends an alert:
        1. Saves to DB
        2. Emits via WebSocket
        3. (Placeholder) Logs High Severity alerts for future email/SMS integration
        """
        try:
            # 1. Save to DB
            new_alert = Alert(
                user_id=user_id,
                message=message,
                level=level
            )
            db.session.add(new_alert)
            # Note: Commit is usually handled by the caller (traffic_monitor task) to batch updates,
            # but if this is called independently, we might need to commit.
            # For now, we assume the caller handles the session or we flush.
            db.session.flush() 

            # 2. Emit via WebSocket
            socketio.emit(
                'alert',
                {'message': message, 'level': level, 'timestamp': datetime.now().isoformat()},
                room=user_id
            )

            # 3. Handle High Severity (Level=Error)
            if level.lower() == 'error':
                AlertManager._handle_critical_alert(user_id, message)

        except Exception as e:
            current_app.logger.error(f"Error in AlertManager: {e}")

    @staticmethod
    def _handle_critical_alert(user_id, message):
        """
        Placeholder for external notifications (Email, SMS, PagerDuty).
        Currently just logs a CRITICAL message.
        """
        current_app.logger.critical(f"CRITICAL ALERT for User {user_id}: {message}")
        # TODO: Integrate Email/SMS service here
        # Example: send_email(user_email, "Critical Network Alert", message)
