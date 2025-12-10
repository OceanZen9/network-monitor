# backend/routes/alerts.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Alert, User

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_alerts():
    """
    Get all alerts for the currently logged-in user.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    alerts = Alert.query.filter_by(user_id=user.id).order_by(Alert.created_at.desc()).all()
    
    return jsonify([alert.to_dict() for alert in alerts]), 200

@alerts_bp.route('/<int:alert_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_alert_as_read(alert_id):
    """
    Mark a specific alert as read.
    """
    user_id = get_jwt_identity()
    alert = Alert.query.filter_by(id=alert_id, user_id=user_id).first()

    if not alert:
        return jsonify({"msg": "Alert not found or you don't have permission"}), 404

    alert.is_read = True
    
    from extensions import db
    try:
        db.session.commit()
        return jsonify(alert.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to update alert", "error": str(e)}), 500

@alerts_bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_alerts_as_read():
    """
    Mark all unread alerts for the user as read.
    """
    user_id = get_jwt_identity()
    
    try:
        unread_alerts = Alert.query.filter_by(user_id=user_id, is_read=False).all()
        for alert in unread_alerts:
            alert.is_read = True
            
        from extensions import db
        db.session.commit()
        return jsonify({"msg": f"Marked {len(unread_alerts)} alerts as read."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to update alerts", "error": str(e)}), 500
