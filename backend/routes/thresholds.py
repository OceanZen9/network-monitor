from flask import Blueprint, request, jsonify
from models import Threshold
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

thresholds_bp = Blueprint('thresholds_bp', __name__)

@thresholds_bp.route('/', methods=['POST'])
@jwt_required()
def create_threshold():
    data = request.get_json()
    user_id = get_jwt_identity()

    metric = data.get('metric')
    value = data.get('value')

    if not all([metric, value]):
        return jsonify({"msg": "Missing metric or value"}), 400

    try:
        new_threshold = Threshold(
            user_id=user_id,
            metric=metric,
            value=float(value)
        )
        db.session.add(new_threshold)
        db.session.commit()
        return jsonify({"msg": "Threshold created successfully", "id": new_threshold.id}), 201
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid value provided"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "An unexpected error occurred", "error": str(e)}), 500

@thresholds_bp.route('/', methods=['GET'])
@jwt_required()
def get_thresholds():
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
    user_id = get_jwt_identity()
    threshold = Threshold.query.filter_by(id=id, user_id=user_id).first_or_404()

    data = request.get_json()

    try:
        if 'value' in data:
            threshold.value = float(data['value'])
        if 'is_enabled' in data:
            threshold.is_enabled = bool(data['is_enabled'])

        db.session.commit()
        return jsonify({"msg": "Threshold updated successfully"})
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid value provided"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "An unexpected error occurred", "error": str(e)}), 500

@thresholds_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_threshold(id):
    user_id = get_jwt_identity()
    threshold = Threshold.query.filter_by(id=id, user_id=user_id).first_or_404()

    try:
        db.session.delete(threshold)
        db.session.commit()
        return jsonify({"msg": "Threshold deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "An unexpected error occurred", "error": str(e)}), 500

