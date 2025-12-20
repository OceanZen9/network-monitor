"""
流量模型模块
定义网络流量数据模型。
"""
# pylint: disable=too-few-public-methods
from datetime import datetime, timezone
from extensions import db

class Traffic(db.Model):
    """流量数据模型"""
    __tablename__ = 'traffic'

    id = db.Column(db.Integer, primary_key=True)
    interface = db.Column(db.String(64), nullable=False)
    bytes_sent = db.Column(db.Integer, nullable=False)
    bytes_recv = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    def to_dict(self):
        """将流量对象转换为字典"""
        return {
            'id': self.id,
            'interface': self.interface,
            'bytes_sent': self.bytes_sent,
            'bytes_recv': self.bytes_recv,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
