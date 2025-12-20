"""
用户模型模块
定义用户数据库模型及密码处理方法。
"""
# pylint: disable=too-few-public-methods
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """将用户对象转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'is_admin': self.is_admin
        }
