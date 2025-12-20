"""
阈值路由模块
处理监控阈值的创建、读取、更新和删除。
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Threshold
from extensions import db

thresholds_bp = Blueprint('thresholds_bp', __name__)

@thresholds_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_threshold():
    """创建新阈值"""
    data = request.get_json()
    user_id = get_jwt_identity()

    metric = data.get('metric')
    value = data.get('value')

    if not all([metric, value]):
        return jsonify({"msg": "缺少指标或值"}), 400

    try:
        new_threshold = Threshold(
            user_id=user_id,
            metric=metric,
            value=float(value)
        )
        db.session.add(new_threshold)
        db.session.commit()
        return jsonify({"msg": "阈值创建成功", "id": new_threshold.id}), 201
    except (ValueError, TypeError):
        return jsonify({"msg": "提供的值无效"}), 400
    except Exception as e: # pylint: disable=broad-exception-caught
        db.session.rollback()
        return jsonify({"msg": "发生未知错误", "error": str(e)}), 500

@thresholds_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_thresholds():
    """获取用户的所有阈值"""
    user_id = get_jwt_identity()
    thresholds = Threshold.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": t.id,
            "metric": t.metric,
            "value": t.value,
            "is_enabled": t.is_enabled
        } for t in thresholds
    ])

@thresholds_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_threshold(id):
    """更新阈值"""
    user_id = get_jwt_identity()
    threshold = Threshold.query.filter_by(id=id, user_id=user_id).first_or_404()

    data = request.get_json()

    try:
        if 'value' in data:
            threshold.value = float(data['value'])
        if 'is_enabled' in data:
            threshold.is_enabled = bool(data['is_enabled'])

        db.session.commit()
        return jsonify({"msg": "阈值更新成功"})
    except (ValueError, TypeError):
        return jsonify({"msg": "提供的值无效"}), 400
    except Exception as e: # pylint: disable=broad-exception-caught
        db.session.rollback()
        return jsonify({"msg": "发生未知错误", "error": str(e)}), 500

@thresholds_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_threshold(id):
    """删除阈值"""
    user_id = get_jwt_identity()
    threshold = Threshold.query.filter_by(id=id, user_id=user_id).first_or_404()

    try:
        db.session.delete(threshold)
        db.session.commit()
        return jsonify({"msg": "阈值删除成功"})
    except Exception as e: # pylint: disable=broad-exception-caught
        db.session.rollback()
        return jsonify({"msg": "发生未知错误", "error": str(e)}), 500


