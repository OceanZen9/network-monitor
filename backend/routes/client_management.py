from flask import Blueprint, jsonify, request
from utils.xml_manager import XMLManager

client_bp = Blueprint('client', __name__)

@client_bp.route('', methods=['GET'])
def get_clients():
    try:
        clients = XMLManager.get_clients()
        return jsonify(clients), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('', methods=['POST'])
def add_client():
    try:
        data = request.json
        if not data or 'name' not in data or 'ip' not in data:
            return jsonify({'error': 'Name and IP are required'}), 400
        
        new_id = XMLManager.add_client(data)
        return jsonify({'message': 'Client added successfully', 'id': new_id}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    try:
        data = request.json
        if XMLManager.update_client(client_id, data):
             return jsonify({'message': 'Client updated successfully'}), 200
        return jsonify({'error': 'Client not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    try:
        if XMLManager.delete_client(client_id):
             return jsonify({'message': 'Client deleted successfully'}), 200
        return jsonify({'error': 'Client not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
