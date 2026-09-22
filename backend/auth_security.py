"""Opaque, hashed server-side credentials. MySQL is mandatory outside explicit mock mode."""
import hashlib
import secrets
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from threading import RLock

from flask import g, jsonify, redirect, request


def digest(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def safe_user(user):
    result = {key: user.get(key) for key in (
        'user_id', 'nama', 'email', 'username', 'phone', 'role', 'status_akun', 'provider')}
    result['status'] = result['status_akun']
    return result


class Security:
    def __init__(self, app, backend):
        self.app, self.backend = app, backend
        self.records = {}
        self.lock = RLock()
        self.clock = time.time
        self.session_ttl = 86400
        self.idle_ttl = 3600
        self.app.add_url_rule('/api/auth/me', 'auth_me', self.me, methods=['GET'])
        self.app.add_url_rule('/api/logout', 'logout', self.logout, methods=['POST'])
        self.app.before_request(self.guard)

    def guard(self):
        if request.method == 'OPTIONS' or not request.path.startswith('/api/'):
            return None
        # Blueprint menambahkan prefix pada nama endpoint (contoh:
        # ``auth.login_user``). Aturan keamanan tetap memakai nama fungsi agar
        # kontraknya sama untuk route lama dan route modular.
        endpoint = (request.endpoint or '').rsplit('.', 1)[-1]
        public = {'register_user', 'login_user', 'health_check', 'forgot_password',
                  'verify_reset_token', 'reset_password', 'auth_session',
                  'submit_feedback_guest', 'track_feedback', 'get_public_feedbacks',
                  'get_all_news', 'get_news_detail'}
        header = request.headers.get('Authorization', '')
        bearer_allowed = self.app.config.get('AUTH_ALLOW_BEARER', False)
        bearer_token = header[7:] if bearer_allowed and header.startswith('Bearer ') else ''
        cookie_token = request.cookies.get(self.app.config['AUTH_COOKIE_NAME'], '')
        try:
            g.auth_token = bearer_token or cookie_token
            g.auth_via_cookie = bool(cookie_token and not bearer_token)
            g.current_user = self.authenticate(g.auth_token) if g.auth_token else None
        except Exception:
            return jsonify(error='Authentication service unavailable'), 503
        if endpoint in public:
            # Cookie yang kedaluwarsa tidak boleh menghalangi login ulang.
            # Header Bearer eksplisit yang tidak valid tetap ditolak.
            if header and not g.current_user:
                return jsonify(error='Authentication required'), 401
            if endpoint == 'get_all_news' and request.args.get('published_only', 'true').lower() != 'true':
                if not g.current_user:
                    return jsonify(error='Authentication required'), 401
                if g.current_user.get('role') != 'superadmin':
                    return jsonify(error='Superadmin access required'), 403
            return None
        if not g.current_user:
            return jsonify(error='Authentication required'), 401
        if g.auth_via_cookie and request.method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            csrf_cookie = request.cookies.get(self.app.config['CSRF_COOKIE_NAME'], '')
            csrf_header = request.headers.get('X-CSRF-Token', '')
            if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
                return jsonify(error='CSRF validation failed'), 403
        admin = g.current_user.get('role') == 'superadmin'
        if (request.path.startswith('/api/admin/') or request.endpoint in {'create_news', 'update_news', 'delete_news'}) and not admin:
            return jsonify(error='Superadmin access required'), 403
        uid = g.current_user['user_id']
        if 'user_id' in (request.view_args or {}) and request.view_args['user_id'] != uid and not admin:
            return jsonify(error='Access denied'), 403
        data = request.get_json(silent=True)
        if data is not None and not isinstance(data, dict):
            return jsonify(error='JSON object required'), 400
        for source in (data or {}, request.args, request.form):
            for field in ('user_id', 'admin_id', 'created_by'):
                if field in source and str(source[field]) != str(uid):
                    return jsonify(error='Identity does not match session'), 403
        if endpoint == 'get_user_role':
            email = request.args.get('email', g.current_user['email'])
            if email.lower() != g.current_user['email'].lower() and not admin:
                return jsonify(error='Access denied'), 403
            if email.lower() == g.current_user['email'].lower():
                return jsonify(email=g.current_user['email'], role=g.current_user['role'])
        return None

    def logout(self):
        self.revoke_token(g.auth_token)
        response = jsonify(message='Logged out')
        self.clear_auth_cookies(response)
        return response

    def set_auth_cookies(self, response, token, expires_at):
        """Simpan token sesi hanya pada cookie HttpOnly dan terbitkan CSRF pair."""
        secure = bool(self.app.config.get('SESSION_COOKIE_SECURE'))
        same_site = self.app.config.get('SESSION_COOKIE_SAMESITE', 'Lax')
        max_age = max(0, int(expires_at - self.clock()))
        response.set_cookie(
            self.app.config['AUTH_COOKIE_NAME'], token, max_age=max_age,
            secure=secure, httponly=True, samesite=same_site, path='/',
        )
        response.set_cookie(
            self.app.config['CSRF_COOKIE_NAME'], secrets.token_urlsafe(32), max_age=max_age,
            secure=secure, httponly=False, samesite=same_site, path='/',
        )

    def clear_auth_cookies(self, response):
        for name in (self.app.config['AUTH_COOKIE_NAME'], self.app.config['CSRF_COOKIE_NAME']):
            response.delete_cookie(
                name, secure=bool(self.app.config.get('SESSION_COOKIE_SECURE')),
                httponly=name == self.app.config['AUTH_COOKIE_NAME'],
                samesite=self.app.config.get('SESSION_COOKIE_SAMESITE', 'Lax'), path='/',
            )

    def revoke_token(self, token):
        key = digest(token)
        if self.mock:
            with self.lock:
                return self.records.pop(key, None)
        with self.db() as (conn, cursor):
            cursor.execute('DELETE FROM AuthSession WHERE token_hash=%s', (key,))
            conn.commit()


    @property
    def mock(self):
        enabled = self.backend.USE_MOCK_DB and self.backend.MOCK_DB_AVAILABLE
        if enabled and self.app.config.get('APP_ENV', self.backend.os.getenv('APP_ENV')) not in ('test', 'development'):
            raise RuntimeError('Mock authentication is restricted to explicit test/development')
        return enabled

    def reset_test_state(self):
        if not self.mock or not self.app.testing:
            raise RuntimeError('Test reset unavailable')
        self.records.clear()

    @contextmanager
    def db(self):
        conn = self.backend.get_db_connection()
        if conn is None:
            raise RuntimeError('Authentication database unavailable')
        cursor = conn.cursor(dictionary=True)
        try:
            yield conn, cursor
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()

    def user(self, user_id):
        if self.mock:
            user = self.backend.mock_db.users.get(int(user_id))
            return dict(user) if user else None
        with self.db() as (_, cursor):
            cursor.execute('SELECT * FROM User WHERE user_id=%s LIMIT 1', (user_id,))
            return cursor.fetchone()

    def issue(self, user, kind='session', ttl=None):
        token = secrets.token_urlsafe(32)
        now = int(self.clock())
        row = dict(token_hash=digest(token), user_id=user['user_id'], kind=kind,
                   expires_at=now + (ttl if ttl is not None else self.session_ttl),
                   last_seen=now, credential_hash=digest(str(user.get('password', ''))))
        if self.mock:
            with self.lock:
                self.records[row['token_hash']] = row
        else:
            with self.db() as (conn, cursor):
                cursor.execute('INSERT INTO AuthSession (token_hash,user_id,kind,expires_at,last_seen,credential_hash) VALUES (%s,%s,%s,%s,%s,%s)', tuple(row.values()))
                conn.commit()
        iso_expires = datetime.fromtimestamp(row['expires_at'], tz=timezone.utc).isoformat()
        return dict(access_token=token, expires_at=iso_expires)

    def lookup(self, token):
        if not isinstance(token, str) or not 20 <= len(token) <= 128:
            return None
        key = digest(token)
        if self.mock:
            with self.lock:
                row = self.records.get(key)
                return dict(row) if row else None
        with self.db() as (_, cursor):
            cursor.execute('SELECT * FROM AuthSession WHERE token_hash=%s', (key,))
            return cursor.fetchone()

    def authenticate(self, token):
        row = self.lookup(token)
        if not row or row['kind'] != 'session' or row['expires_at'] <= self.clock():
            return None
        user = self.user(row['user_id'])
        if not user or user.get('status_akun') not in ('aktif', 'active'):
            self.revoke_all(row['user_id'])
            return None
        if row['credential_hash'] != digest(str(user.get('password', ''))) or row['last_seen'] + self.idle_ttl <= self.clock():
            self.revoke_all(row['user_id'])
            return None
        if self.mock:
            with self.lock:
                if row['token_hash'] not in self.records:
                    return None
                self.records[row['token_hash']]['last_seen'] = int(self.clock())
        else:
            with self.db() as (conn, cursor):
                cursor.execute('UPDATE AuthSession SET last_seen=%s WHERE token_hash=%s', (int(self.clock()), row['token_hash']))
                conn.commit()
        return user

    def revoke_all(self, user_id):
        if self.mock:
            with self.lock:
                for key in [key for key, row in self.records.items() if row['user_id'] == user_id]:
                    del self.records[key]
        else:
            with self.db() as (conn, cursor):
                cursor.execute('DELETE FROM AuthSession WHERE user_id=%s', (user_id,))
                conn.commit()

    def login_response(self, user):
        current = self.user(user['user_id'])
        if not current or current.get('status_akun') not in ('aktif', 'active'):
            if current:
                self.revoke_all(current['user_id'])
            return jsonify(error='Username atau password salah'), 401
        issued = self.issue(current)
        token = issued['access_token']
        result = safe_user(current)
        result['expires_at'] = issued['expires_at']
        if self.app.config.get('AUTH_ALLOW_BEARER', False):
            result['access_token'] = token
        result['message'] = f"Login sukses. Selamat datang, {current['nama']}!"
        # Indicate whether the user has a locally-set password (useful for Google OAuth users)
        pwd = current.get('password', '')
        result['has_password'] = bool(pwd and not pwd.startswith('oauth'))
        response = jsonify(result)
        self.set_auth_cookies(response, token, datetime.fromisoformat(issued['expires_at']).timestamp())
        return response, 200

    def login_redirect(self, user, location):
        """Buat sesi dan redirect OAuth tanpa menaruh kredensial pada URL."""
        current = self.user(user['user_id'])
        if not current or current.get('status_akun') not in ('aktif', 'active'):
            return redirect(f'{location}?auth_error=inactive', code=302)
        issued = self.issue(current)
        response = redirect(location, code=302)
        self.set_auth_cookies(
            response, issued['access_token'],
            datetime.fromisoformat(issued['expires_at']).timestamp(),
        )
        return response

    def me(self):
        user = getattr(g, 'current_user', None)
        if not user:
            return jsonify(error='Authentication required'), 401
        return jsonify(safe_user(user))
