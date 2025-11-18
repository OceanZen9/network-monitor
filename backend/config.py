class Config:
    """
    应用配置
    """
    DEBUG = True
    CORS_ORIGINS = [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://127.0.0.1:5173", 
        "http://127.0.0.1:5174"],

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