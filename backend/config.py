"""
配置模块
"""
import os

class Config:
    """
    通用应用配置
    """
    DEBUG = True
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]
    SOCKETIO_ASYNC_MODE = "threading"

    # 数据库配置 使用SQLite
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'super-secret-key-change-this'
    JWT_ACCESS_TOKEN_EXPIRES = 15 * 60  # 15分钟
    JWT_REFRESH_TOKEN_EXPIRES = 30 * 24 * 60 * 60  # 30天

    TRAFFIC_UPDATE_INTERVAL = 3  # 秒
    MAX_PACKETS_DISPLAY = 50
    PACKET_PRINT_INTERVAL = 100


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    # 生产环境的其他配置


# 根据环境选择配置
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}