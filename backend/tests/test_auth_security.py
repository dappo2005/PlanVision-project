"""Security regressions; isolated mock storage, no network/real DB writes."""
import os
import sys
from pathlib import Path

os.environ.update(APP_ENV='test', USE_MOCK_DB='1', SKIP_MODEL_LOAD='1', PYTHON_DOTENV_DISABLED='1')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pytest
import bcrypt
import app as backend
from mock_db import MockDatabase

@pytest.fixture
def client(monkeypatch):
    db = MockDatabase()
    for user in db.users.values():
        user['password'] = bcrypt.hashpw(b'Test-password-123', bcrypt.gensalt(rounds=4)).decode()
    monkeypatch.setattr(backend, 'mock_db', db)
    monkeypatch.setattr(backend, 'get_db_connection', lambda: None)
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
