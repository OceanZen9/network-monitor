from flask import Flask
from config import config
from extensions import socketio, cors

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

    # 注册蓝图
    app.register_blueprint(auth_bp)
    app.register_blueprint(devices_bp)

     # 导入 WebSocket 事件处理
    with app.app_context():
        import routes.monitoring


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