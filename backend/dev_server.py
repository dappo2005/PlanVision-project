from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route('/', methods=['GET'])
def index():
    return 'OK', 200

# terima /auth/login dan /api/login (preflight OPTIONS akan ditangani oleh flask-cors)
@app.route('/auth/login', methods=['POST'])
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email') or data.get('username') or ''
    password = data.get('password') or ''
    if not email or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    return jsonify({
        'success': True,
        'token': 'dev-token',
        'user': {'email': email}
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)