"""
告警路由模块
处理告警的获取、标记已读等操作。
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Alert, User

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_alerts():
    """
    获取当前登录用户的所有告警。
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "用户未找到"}), 404

    alerts = Alert.query.filter_by(user_id=user.id).order_by(Alert.created_at.desc()).all()

    return jsonify([alert.to_dict() for alert in alerts]), 200

@alerts_bp.route('/<int:alert_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_alert_as_read(alert_id):
    """
    标记特定告警为已读。
    """
    user_id = get_jwt_identity()
    alert = Alert.query.filter_by(id=alert_id, user_id=user_id).first()

    if not alert:
        return jsonify({"msg": "告警未找到或无权访问"}), 404

    alert.is_read = True

    # pylint: disable=import-outside-toplevel
    from extensions import db
    try:
        db.session.commit()
        return jsonify(alert.to_dict()), 200
    except Exception as e: # pylint: disable=broad-exception-caught
        db.session.rollback()
        return jsonify({"msg": "更新告警失败", "error": str(e)}), 500

@alerts_bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_alerts_as_read():
    """
    标记用户的所有未读告警为已读。
    """
    user_id = get_jwt_identity()

    try:
        unread_alerts = Alert.query.filter_by(user_id=user_id, is_read=False).all()
        for alert in unread_alerts:
            alert.is_read = True

        # pylint: disable=import-outside-toplevel
        from extensions import db
        db.session.commit()
        return jsonify({"msg": f"已标记 {len(unread_alerts)} 条告警为已读。"}), 200
    except Exception as e: # pylint: disable=broad-exception-caught
        db.session.rollback()
        return jsonify({"msg": "更新告警失败", "error": str(e)}), 500
