from flask import Flask
from flask_migrate import Migrate
from config import config
from extensions import socketio, cors, jwt, db
from models import User

# 导入蓝图
from routes.auth import auth_bp
from routes.devices import devices_bp
from routes.history import history_bp # Add this line
from routes.thresholds import thresholds_bp
from services.traffic_monitor import monitor_traffic_task # Add this line

def create_app(config_name='default'):
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
    app.register_blueprint(auth_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(history_bp) # Add this line
    app.register_blueprint(thresholds_bp)

     # 导入 WebSocket 事件处理
    with app.app_context():
        import routes.monitoring

        try:
            if not User.query.filter_by(username="admin").first():
                print("⚠️  Creating default user: admin / 123456")
                user = User(username="admin")
                user.set_password("123456")
                db.session.add(user)
                db.session.commit()
        except Exception as e:
            # 捕获表不存在的错误（例如首次启动未迁移时），避免应用崩溃
            print(f"⚠️  Database not initialized. Run 'flask db upgrade' first. Error: {e}")

    return app

if __name__ == '__main__':
    app = create_app('development')
    
    socketio.start_background_task(target=monitor_traffic_task, app=app)
    
    print("=" * 60)
    print("🚀 Starting Network Monitor Server")
    print("=" * 60)
    print(f"📍 Server: http://127.0.0.1:5000/")
    print(f"⚠️  Note: Scapy may require 'sudo' for packet sniffing")
    print("=" * 60)
    
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)