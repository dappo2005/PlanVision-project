"""Health check dan penyajian build React pada origin yang sama."""
import os

from flask import Blueprint, jsonify, send_from_directory

from plantvision import services
from plantvision.services import get_db_connection

bp = Blueprint('system', __name__)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'build'))

# --- Health Check Endpoint (untuk deployment platforms) ---
@bp.route('/api/health', methods=['GET'])
@bp.route('/health', methods=['GET'])
def health_check():
    """Minimal readiness endpoint for local operations and Funnel checks."""
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            database_ready = True
        else:
            database_ready = False
    except Exception:
        database_ready = False
    ready = database_ready and services.MODEL is not None
    return jsonify({"status": "ready" if ready else "unavailable"}), 200 if ready else 503

# --- SPA: serve built React frontend (single container deployment) ---
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'build'))

@bp.route('/')
def serve_index():
    """Serve index.html dari hasil build React frontend."""
    if not os.path.isfile(os.path.join(FRONTEND_DIST, 'index.html')):
        return jsonify({"message": "PlantVision API berjalan. Frontend belum di-build."}), 200
    return send_from_directory(FRONTEND_DIST, 'index.html')

@bp.route('/<path:path>')
def serve_spa(path):
    """Serve static assets dari build/, fallback ke index.html untuk React Router (SPA)."""
    if path.startswith('api/') or path.startswith('auth/') or path.startswith('health'):
        return jsonify({"error": "Not found"}), 404
    full_path = os.path.join(FRONTEND_DIST, path)
    if os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIST, path)
    if os.path.isfile(os.path.join(FRONTEND_DIST, 'index.html')):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return jsonify({"error": "Not found"}), 404
