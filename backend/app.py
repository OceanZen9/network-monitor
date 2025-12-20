"""
应用入口模块
负责创建Flask应用，初始化扩展，注册蓝图，并启动应用。
"""
from flask import Flask
from flask_migrate import Migrate

from config import config
from extensions import socketio, cors, jwt, db
from models import User
from routes.auth import auth_bp
from routes.devices import devices_bp
from routes.history import history_bp
from routes.thresholds import thresholds_bp
from routes.alerts import alerts_bp
from routes import monitoring  # 导入 WebSocket 事件处理
from services.traffic_monitor import monitor_traffic_task

def create_app(config_name='default'):
    """
    创建并配置Flask应用实例
    
    Args:
        config_name (str): 配置名称，默认为 'default'
        
    Returns:
        Flask: 配置好的Flask应用实例
    """
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])

    # 初始化扩展
    cors.init_app(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    socketio.init_app(
        app,
        cors_allowed_origins=app.config['CORS_ORIGINS'],
        async_mode=app.config['SOCKETIO_ASYNC_MODE']
    )
    db.init_app(app)
    jwt.init_app(app)
    Migrate(app, db)

    # 注册蓝图
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(devices_bp, url_prefix='/api/devices')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    app.register_blueprint(thresholds_bp, url_prefix='/api/thresholds')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')

    with app.app_context():
        # 确保 monitoring 模块被加载
        # pylint: disable=unused-import, import-outside-toplevel
        import routes.monitoring as _  # noqa: F401

        try:
            if not User.query.filter_by(username="admin").first():
                print("⚠️  创建默认用户: admin / 123456")
                user = User(username="admin")
                user.set_password("123456")
                db.session.add(user)
                db.session.commit()
        except Exception as e: # pylint: disable=broad-exception-caught
            # 捕获表不存在的错误（例如首次启动未迁移时），避免应用崩溃
            print(f"⚠️  数据库未初始化。请先运行 'flask db upgrade'。错误: {e}")

    return app

if __name__ == '__main__':
    created_app = create_app('development')

    socketio.start_background_task(target=monitor_traffic_task, app=created_app)

    print("=" * 60)
    print("🚀 启动网络监控服务器")
    print("=" * 60)
    print("📍 服务器地址: http://127.0.0.1:5000/")
    print("⚠️  注意: Scapy 可能需要 'sudo' 权限来进行数据包嗅探")
    print("=" * 60)

    socketio.run(created_app, host='127.0.0.1', debug=True, port=5000, allow_unsafe_werkzeug=True)