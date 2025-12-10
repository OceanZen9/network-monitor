from flask import Blueprint, jsonify, request
from models import Traffic
from extensions import db
from datetime import datetime, timezone

history_bp = Blueprint('history', __name__)

@history_bp.route('/traffic', methods=['GET'], strict_slashes=False)
def get_historical_traffic():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    start_time_str = request.args.get('start_time')
    end_time_str = request.args.get('end_time')

    query = Traffic.query

    if start_time_str:
        try:
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            query = query.filter(Traffic.created_at >= start_time)
        except ValueError:
            return jsonify({"message": "Invalid start_time format"}), 400

    if end_time_str:
        try:
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            query = query.filter(Traffic.created_at <= end_time)
        except ValueError:
            return jsonify({"message": "Invalid end_time format"}), 400

    pagination = query.order_by(Traffic.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    traffic_data = [item.to_dict() for item in pagination.items]

    return jsonify({
        "traffic": traffic_data,
        "total_items": pagination.total,
        "total_pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev
    })

