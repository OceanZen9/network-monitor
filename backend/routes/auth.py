"""
认证路由模块
处理用户登录、注册、注销和令牌刷新等操作。
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import User
from extensions import db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录接口"""
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    print(f"调试登录: 用户名='{username}', 密码长度={len(password)}")

    print(f"调试登录: 接收到的用户名={username}")
    user = User.query.filter_by(username=username).first()

    if user is None:
        print("调试登录: 数据库中未找到用户")
        return jsonify({"error": "用户名或密码无效"}), 401

    if not user.check_password(password):
        print("调试登录: 密码验证失败")
        return jsonify({"error": "用户名或密码无效"}), 401

    # 确保 identity 是字符串
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        "message": "登录成功",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册接口"""
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "必须提供用户名和密码"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "用户名已存在"}), 400

    print(f"调试注册: 创建用户={username}")
    user = User(username=username)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "用户创建成功"}), 201

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """用户注销接口"""
    return jsonify({"message": "注销成功"})

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """刷新访问令牌接口"""
    current_user_id = get_jwt_identity()
    # 确保新令牌的 identity 也是字符串
    new_access_token = create_access_token(identity=str(current_user_id))
    return jsonify({
        "access_token": new_access_token
    }), 200

