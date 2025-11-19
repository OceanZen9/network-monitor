from flask import Flask
from flask_migrate import Migrate
from config import config
from extensions import socketio, cors, jwt, db
from models import User

# 导入蓝图
from routes.auth import auth_bp
from routes.devices import devices_bp

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

     # 导入 WebSocket 事件处理
    with app.app_context():
        import routes.monitoring

        # 自动创建表和默认用户
        db.create_all()
        if not User.query.filter_by(username="admin").first():
            print("⚠️  Creating default user: admin / 123456")
            user = User(username="admin")
            user.set_password("123456")
            db.session.add(user)
            db.session.commit()

    return app

if __name__ == '__main__':
    app = create_app('development')
    
    print("=" * 60)
    print("🚀 Starting Network Monitor Server")
    print("=" * 60)
    print(f"📍 Server: http://127.0.0.1:5000/")
    print(f"⚠️  Note: Scapy may require 'sudo' for packet sniffing")
    print("=" * 60)
    
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)