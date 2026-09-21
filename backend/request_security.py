"""Small in-process safeguards for the single-process Waitress deployment."""
from collections import defaultdict, deque
from threading import RLock
import hashlib
import time

from flask import g, jsonify, request


class RequestSecurity:
    LIMITS = {
        'login_user': (10, 60),
        'register_user': (5, 3600),
        'forgot_password': (5, 3600),
        'verify_reset_token': (30, 60),
        'reset_password': (10, 3600),
        'auth_session': (20, 60),
        'submit_feedback_guest': (10, 3600),
        'predict_disease': (30, 60),
        'chat_ai': (30, 60),
    }

    def __init__(self, app):
        self.app = app
        self.clock = time.monotonic
        self.hits = defaultdict(deque)
        self.lock = RLock()
        app.before_request(self.limit)
        app.after_request(self.headers)

    def client_key(self):
        current = getattr(g, 'current_user', None)
        if current:
            return f"user:{current['user_id']}"

        # Funnel terminates locally, so public clients can share a loopback
        # address. Add the account/form identity where available without
        # trusting a spoofable forwarding header.
        remote = request.remote_addr or 'unknown'
        payload = request.get_json(silent=True)
        if isinstance(payload, dict):
            for field in ('username', 'email', 'token'):
                value = str(payload.get(field, '')).strip().lower()
                if value:
                    digest = hashlib.sha256(value[:160].encode('utf-8')).hexdigest()
                    return f'{remote}:{field}:{digest}'
        return remote

    def limit(self):
        if self.app.testing or request.method == 'OPTIONS':
            return None
        endpoint = (request.endpoint or '').rsplit('.', 1)[-1]
        rule = self.LIMITS.get(endpoint)
        if not rule:
            return None
        maximum, window = rule
        now = self.clock()
        key = (endpoint, self.client_key())
        with self.lock:
            bucket = self.hits[key]
            while bucket and bucket[0] <= now - window:
                bucket.popleft()
            if len(bucket) >= maximum:
                retry_after = max(1, int(window - (now - bucket[0])))
                response = jsonify(error='Terlalu banyak permintaan. Coba lagi nanti.')
                response.status_code = 429
                response.headers['Retry-After'] = str(retry_after)
                return response
            bucket.append(now)
        return None

    def headers(self, response):
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.setdefault(
            'Permissions-Policy',
            'camera=(self), microphone=(), geolocation=()'
        )
        response.headers.setdefault(
            'Content-Security-Policy',
            "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; "
            "script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: https:; font-src 'self' data:; "
            "connect-src 'self' https: http://192.168.4.1"
        )
        if request.path.startswith('/api/'):
            response.headers.setdefault('Cache-Control', 'no-store')
        elif request.path.startswith('/assets/'):
            response.headers.setdefault('Cache-Control', 'public, max-age=31536000, immutable')
        if self.app.config.get('APP_ENV') in {'staging', 'production'}:
            response.headers.setdefault('Strict-Transport-Security', 'max-age=31536000')
        return response
