"""
阈值模型模块
定义监控阈值数据库模型。
"""
# pylint: disable=too-few-public-methods
from extensions import db

class Threshold(db.Model):
    """阈值模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    metric = db.Column(db.String(50), nullable=False)  # 例如: 'upload_speed', 'download_speed'
    value = db.Column(db.Float, nullable=False)
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)

    def __repr__(self):
        return f'<Threshold {self.metric} {self.value}>'
