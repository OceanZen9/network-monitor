"""
模型模块初始化
导出所有数据库模型。
"""
from models.user import User
from models.traffic import Traffic
from models.threshold import Threshold
from models.alert import Alert

__all__ = ['User', 'Traffic', 'Threshold', 'Alert']
