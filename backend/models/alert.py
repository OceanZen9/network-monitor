"""
告警模型模块
定义告警数据库模型。
"""
# pylint: disable=too-few-public-methods
from datetime import datetime, timezone
from extensions import db

class Alert(db.Model):
    """告警模型"""
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    level = db.Column(db.String(50), nullable=False, default='warning')
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('alerts', lazy=True))

    def to_dict(self):
        """将告警对象转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'level': self.level,
            'is_read': self.is_read,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
