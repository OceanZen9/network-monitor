from flask import Flask
from flask_cors import CORS # 导入

app = Flask(__name__)
# 允许来自 'http://localhost:5173' (Vite) 的请求
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}) 

# 这是一个测试 API 路由
@app.route("/api/test")
def hello_world():
    # 这里将来会放你的抓包数据
    return {"message": "Hello from Python Backend!"}

if __name__ == '__main__':
    app.run(debug=True, port=5000)