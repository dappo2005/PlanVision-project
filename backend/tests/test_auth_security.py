"""Security regressions; isolated mock storage, no network/real DB writes."""
import os
import sys
from io import BytesIO
from pathlib import Path

os.environ.update(APP_ENV='test', USE_MOCK_DB='1', SKIP_MODEL_LOAD='1', PYTHON_DOTENV_DISABLED='1')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pytest
import bcrypt
from PIL import Image
import app as backend
from mock_db import MockDatabase
from plantvision import services
from plantvision.routes import auth as auth_routes
from plantvision.routes import detection as detection_routes

@pytest.fixture
def client(monkeypatch):
    db = MockDatabase()
    for user in db.users.values():
        user['password'] = bcrypt.hashpw(b'Test-password-123', bcrypt.gensalt(rounds=4)).decode()
    monkeypatch.setattr(backend, 'mock_db', db)
    monkeypatch.setattr(services, 'mock_db', db)
    monkeypatch.setattr(auth_routes, 'mock_db', db)
    monkeypatch.setattr(detection_routes, 'mock_db', db)
    monkeypatch.setattr(backend, 'get_db_connection', lambda: None)
    monkeypatch.setattr(services, 'get_db_connection', lambda: None)
    monkeypatch.setattr(auth_routes, 'get_db_connection', lambda: None)
    monkeypatch.setattr(detection_routes, 'get_db_connection', lambda: None)
    backend.app.config.update(TESTING=True)
    if hasattr(backend, 'security'):
        backend.security.reset_test_state()
    return backend.app.test_client()

def login(client, username='testuser'):
    response = client.post('/api/login', json={'username': username, 'password': 'Test-password-123'})
    assert response.status_code == 200
    return response.get_json()

def bearer(user):
    return {'Authorization': 'Bearer ' + user['access_token']}

def valid_png():
    output = BytesIO()
    Image.new('RGB', (32, 32), color=(30, 140, 60)).save(output, format='PNG')
    output.seek(0)
    return output

class DummyModel:
    def predict(self, _image, verbose=0):
        return backend.np.array([[0.9, 0.02, 0.03, 0.04, 0.01]])

def test_application_applies_fail_closed_runtime_config(client):
    assert backend.app.config['APP_ENV'] == 'test'
    assert backend.app.config['DEBUG'] is False
    assert '*' not in backend.app.config['ALLOWED_ORIGINS']
    assert backend.app.secret_key


def test_wsgi_entrypoint_and_route_inventory(client):
    """Refactor modul tidak boleh menghilangkan kontrak URL publik."""
    assert backend.app is not None
    actual = {
        (method, str(rule.rule))
        for rule in backend.app.url_map.iter_rules()
        if rule.endpoint != 'static'
        for method in rule.methods - {'HEAD', 'OPTIONS'}
    }
    expected = {
        ('GET', '/'), ('GET', '/<path:path>'), ('GET', '/health'),
        ('GET', '/api/health'), ('GET', '/auth/google'),
        ('GET', '/auth/google/callback'), ('POST', '/api/auth/session'),
        ('GET', '/api/auth/me'), ('POST', '/api/logout'),
        ('POST', '/api/register'), ('POST', '/api/login'),
        ('POST', '/api/set-password'), ('POST', '/api/forgot-password'),
        ('GET', '/api/reset-password/verify'), ('POST', '/api/reset-password'),
        ('GET', '/api/dashboard/kpi'), ('POST', '/api/predict'),
        ('GET', '/api/detection-history/<int:user_id>'),
        ('GET', '/api/uploads/<filename>'),
        ('POST', '/api/feedback/submit-guest'),
        ('POST', '/api/feedback/submit'),
        ('GET', '/api/feedback/my-feedbacks/<int:user_id>'),
        ('PUT', '/api/feedback/update/<int:feedback_id>'),
        ('GET', '/api/feedback/track/<tracking_code>'),
        ('GET', '/api/feedback/public'), ('POST', '/api/chat'),
        ('GET', '/api/user/role'), ('GET', '/api/admin/feedbacks'),
        ('GET', '/api/admin/feedbacks/stats'),
        ('PUT', '/api/admin/feedbacks/<int:feedback_id>/status'),
        ('POST', '/api/admin/feedbacks/<int:feedback_id>/response'),
        ('GET', '/api/admin/users/stats'), ('GET', '/api/admin/users'),
        ('POST', '/api/admin/users'),
        ('PUT', '/api/admin/users/<int:target_id>'),
        ('DELETE', '/api/admin/users/<int:target_id>'),
        ('GET', '/api/admin/detections/stats'),
        ('GET', '/api/admin/detections'),
        ('GET', '/api/admin/activities'), ('GET', '/api/admin/news/stats'),
        ('GET', '/api/news'), ('POST', '/api/news'),
        ('GET', '/api/news/<int:news_id>'),
        ('PUT', '/api/news/<int:news_id>'),
        ('DELETE', '/api/news/<int:news_id>'),
    }
    assert actual == expected

def test_login_issues_server_session_and_me(client):
    user = login(client)
    assert 'access_token' in user
    assert 'expires_at' in user
    response = client.get('/api/auth/me', headers=bearer(user))
    assert response.status_code == 200
    assert response.json['user_id'] == 1
    assert 'password' not in response.json
    assert 'reset_token' not in response.json

@pytest.mark.parametrize('method,path', [
    ('GET', '/api/admin/users'), ('POST', '/api/admin/users'),
    ('PUT', '/api/admin/users/2'), ('DELETE', '/api/admin/users/2'),
    ('GET', '/api/admin/users/stats'), ('GET', '/api/admin/detections'),
    ('GET', '/api/admin/detections/stats'), ('GET', '/api/admin/activities'),
    ('GET', '/api/admin/news/stats'), ('GET', '/api/admin/feedbacks?admin_id=2'),
    ('GET', '/api/admin/feedbacks/stats?admin_id=2'),
    ('PUT', '/api/admin/feedbacks/1/status'), ('POST', '/api/admin/feedbacks/1/response'),
    ('POST', '/api/news'), ('PUT', '/api/news/1'), ('DELETE', '/api/news/1'),
    ('GET', '/api/detection-history/1'), ('GET', '/api/feedback/my-feedbacks/1'),
    ('PUT', '/api/feedback/update/1'), ('POST', '/api/feedback/submit'),
    ('POST', '/api/set-password'), ('POST', '/api/chat'), ('POST', '/api/predict'),
    ('GET', '/api/dashboard/kpi'), ('GET', '/api/user/role?email=test@example.com'),
    ('GET', '/api/future-unregistered-route'),
])
def test_protected_routes_deny_anonymous(client, method, path):
    assert client.open(path, method=method, json={'admin_id': 2, 'user_id': 1}).status_code == 401

@pytest.mark.parametrize('path', ['/api/admin/users', '/api/admin/detections', '/api/admin/activities', '/api/admin/feedbacks?admin_id=2'])
def test_user_cannot_claim_admin(client, path):
    assert client.get(path, headers=bearer(login(client))).status_code == 403

@pytest.mark.parametrize('path', ['/api/detection-history/2', '/api/feedback/my-feedbacks/2', '/api/user/role?email=admin@example.com'])
def test_cross_user_reads_denied(client, path):
    assert client.get(path, headers=bearer(login(client))).status_code == 403

def test_forged_feedback_identity_denied(client):
    response = client.post('/api/feedback/submit', headers=bearer(login(client)), json={'user_id': 2})
    assert response.status_code == 403

def test_logout_revokes_token(client):
    user = login(client)
    assert client.post('/api/logout', headers=bearer(user)).status_code == 200
    assert client.get('/api/auth/me', headers=bearer(user)).status_code == 401

def test_expiry_and_idle_revoke_all_sessions(client, monkeypatch):
    user = login(client)
    other = login(client)
    now = backend.security.clock()
    monkeypatch.setattr(backend.security, 'clock', lambda: now + backend.security.idle_ttl + 1)
    assert client.get('/api/auth/me', headers=bearer(user)).status_code == 401
    monkeypatch.setattr(backend.security, 'clock', lambda: now)
    assert client.get('/api/auth/me', headers=bearer(other)).status_code == 401

def test_inactive_and_demoted_users_rechecked(client):
    user = login(client, 'adminuser')
    backend.mock_db.users[2]['role'] = 'user'
    assert client.get('/api/admin/users', headers=bearer(user)).status_code == 403
    backend.mock_db.users[2]['status_akun'] = 'inactive'
    assert client.get('/api/auth/me', headers=bearer(user)).status_code == 401
    assert client.post('/api/login', json={'username': 'adminuser', 'password': 'Test-password-123'}).status_code == 401

def test_upload_rejects_extension_and_fake_image(client, monkeypatch):
    monkeypatch.setattr(backend, 'MODEL', DummyModel())
    monkeypatch.setattr(services, 'MODEL', backend.MODEL)
    headers = bearer(login(client))
    wrong_extension = client.post(
        '/api/predict', headers=headers,
        data={'image': (BytesIO(b'not-an-image'), 'leaf.txt'), 'user_id': '1'},
        content_type='multipart/form-data',
    )
    assert wrong_extension.status_code == 415
    fake_jpeg = client.post(
        '/api/predict', headers=headers,
        data={'image': (BytesIO(b'not-a-jpeg'), 'leaf.jpg'), 'user_id': '1'},
        content_type='multipart/form-data',
    )
    assert fake_jpeg.status_code == 400

def test_upload_is_reencoded_randomized_and_owner_protected(client, monkeypatch, tmp_path):
    monkeypatch.setattr(backend, 'MODEL', DummyModel())
    monkeypatch.setattr(services, 'MODEL', backend.MODEL)
    backend.app.config['UPLOAD_FOLDER'] = str(tmp_path)
    owner = login(client)
    response = client.post(
        '/api/predict', headers=bearer(owner),
        data={'image': (valid_png(), 'my original leaf.png'), 'user_id': '1'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 200
    image_url = response.json['image_url']
    saved_name = image_url.rsplit('/', 1)[-1]
    assert saved_name.endswith('.jpg')
    assert 'original' not in saved_name
    with Image.open(tmp_path / saved_name) as saved:
        assert saved.format == 'JPEG'
    assert client.get(image_url, headers=bearer(owner)).status_code == 200

    backend.mock_db.users[3] = {
        'user_id': 3, 'nama': 'Other User', 'email': 'other@example.com',
        'username': 'otheruser', 'phone': None,
        'password': bcrypt.hashpw(b'Test-password-123', bcrypt.gensalt(rounds=4)).decode(),
        'role': 'user', 'status_akun': 'aktif', 'provider': 'local',
    }
    other = login(client, 'otheruser')
    assert client.get(image_url, headers=bearer(other)).status_code == 403


def test_login_predict_and_history_smoke_flow(client, monkeypatch, tmp_path):
    """Alur inti pengguna tetap tersambung setelah route dipisahkan."""
    monkeypatch.setattr(services, 'MODEL', DummyModel())
    backend.app.config['UPLOAD_FOLDER'] = str(tmp_path)
    user = login(client)

    prediction = client.post(
        '/api/predict', headers=bearer(user),
        data={'image': (valid_png(), 'leaf.png'), 'user_id': '1'},
        content_type='multipart/form-data',
    )
    assert prediction.status_code == 200
    assert prediction.json['class'] == 'Black spot'

    history = client.get('/api/detection-history/1', headers=bearer(user))
    assert history.status_code == 200
    assert history.json['total'] == 1
    assert history.json['history'][0]['disease_name'] == 'Black spot'

def test_upload_size_limit_returns_json_413(client, monkeypatch):
    monkeypatch.setattr(backend, 'MODEL', DummyModel())
    monkeypatch.setattr(services, 'MODEL', backend.MODEL)
    oversized = BytesIO(b'x' * (backend.app.config['MAX_CONTENT_LENGTH'] + 1))
    response = client.post(
        '/api/predict', headers=bearer(login(client)),
        data={'image': (oversized, 'large.jpg'), 'user_id': '1'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 413
    assert response.is_json

def test_security_headers_are_added(client):
    response = client.get('/')
    assert response.headers['X-Content-Type-Options'] == 'nosniff'
    assert response.headers['X-Frame-Options'] == 'DENY'
    assert "default-src 'self'" in response.headers['Content-Security-Policy']

def test_login_rate_limit(client):
    backend.request_security.hits.clear()
    backend.app.config['TESTING'] = False
    try:
        for _ in range(10):
            assert client.post(
                '/api/login',
                json={'username': 'missing-user', 'password': 'wrong-password'},
            ).status_code == 401
        limited = client.post(
            '/api/login',
            json={'username': 'missing-user', 'password': 'wrong-password'},
        )
        assert limited.status_code == 429
        assert int(limited.headers['Retry-After']) >= 1
    finally:
        backend.app.config['TESTING'] = True
        backend.request_security.hits.clear()
