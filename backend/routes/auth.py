# backend/routes/auth.py

from flask import Blueprint, jsonify, request

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    print("LOG: /api/auth/login was hit")
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    if username == "admin" and password == "123456":
        return jsonify({
            "message": "Login successful",
            "user": {"username": "admin", "role": "admin"},
            "token": "fake-jwt-token-for-admin-user"
        })
    else:
        return jsonify({"error": "Invalid username or password"}), 401


@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册（待实现）"""
    # TODO: 实现注册逻辑
    return jsonify({"message": "Registration endpoint - coming soon"}), 501


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """用户登出"""
    # TODO: 实现登出逻辑
    return jsonify({"message": "Logout successful"})
