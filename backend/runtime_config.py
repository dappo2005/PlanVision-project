"""Validate security-sensitive configuration before the application starts.

Call after load_dotenv(). Never include environment values in validation errors.
Development is local-only by default; staging follows production requirements.
"""
import os
import re
import secrets
from urllib.parse import urlsplit


TRUE_VALUES = {'1', 'true', 'yes', 'on'}
PROTECTED_ENVS = {'staging', 'production'}


def _origin(value, field, require_https=False):
    """Accept a literal browser origin, not a flask-cors regex or URL path."""
    try:
        parsed = urlsplit(value)
        port = parsed.port
        host = parsed.hostname
        valid = (
            parsed.scheme in ({'https'} if require_https else {'http', 'https'})
            and host
            and re.fullmatch(r'[a-zA-Z0-9.-]+', host)
            and not any(c in value for c in '*[](){}|^$\\')
            and parsed.username is None and parsed.password is None
            and parsed.path == '' and not parsed.query and not parsed.fragment
            and value == f'{parsed.scheme}://{parsed.netloc}'
            and (port is None or 0 < port < 65536)
        )
    except ValueError:
        valid = False
    if not valid:
        raise ValueError(f'{field} must contain exact {"HTTPS " if require_https else "HTTP(S) "}origins without paths or wildcards')
    return value


def load_runtime_config(environ=None):
    env = os.environ if environ is None else environ
    stage = env.get('APP_ENV', env.get('FLASK_ENV', 'development')).strip().lower()
    if stage not in {'development', 'test', 'staging', 'production'}:
        raise ValueError('APP_ENV must be development, test, staging, or production')
    if env.get('FLASK_ENV', '').lower() == 'production' and stage not in PROTECTED_ENVS:
        raise ValueError('APP_ENV cannot downgrade FLASK_ENV=production')
    protected = stage in PROTECTED_ENVS
    debug = env.get('FLASK_DEBUG', '0').strip().lower() in TRUE_VALUES
    key = env.get('SECRET_KEY', '').strip()
    if protected:
        for field in ('SECRET_KEY', 'DB_HOST', 'DB_USER', 'DB_PASSWORD',
                      'DB_NAME', 'ALLOWED_ORIGINS', 'FRONTEND_URL'):
            if not env.get(field, '').strip():
                raise ValueError(f'{field} is required in staging/production')
        if (len(key) < 32 or len(set(key)) < 8
                or any(marker in key.lower() for marker in ('your-secret', 'replace-', 'change-me', 'changeme'))):
            raise ValueError('SECRET_KEY must be a strong random secret of at least 32 characters, not a placeholder')
        db_password = env['DB_PASSWORD'].strip().lower()
        if (db_password in {'your_password', 'your_db_password', 'change_me', 'changeme'}
                or db_password.startswith('replace-')):
            raise ValueError('DB_PASSWORD must not be an example placeholder')
        for field in ('FLASK_DEBUG', 'USE_MOCK_DB', 'SKIP_MODEL_LOAD'):
            if env.get(field, '0').strip().lower() in TRUE_VALUES:
                raise ValueError(f'{field} is forbidden in staging/production')
    if not key:
        # Suitable only for a local development/test process; never production.
        key = secrets.token_urlsafe(48)

    try:
        max_upload_mb = int(env.get('MAX_UPLOAD_MB', '8'))
    except ValueError as exc:
        raise ValueError('MAX_UPLOAD_MB must be an integer') from exc
    if not 1 <= max_upload_mb <= 16:
        raise ValueError('MAX_UPLOAD_MB must be between 1 and 16')

    default_origins = 'http://localhost:3000,http://127.0.0.1:3000'
    origins = [part.strip() for part in env.get('ALLOWED_ORIGINS', default_origins).split(',')]
    origins = [_origin(item, 'ALLOWED_ORIGINS', protected) for item in origins]
    frontend = env.get('FRONTEND_URL', 'http://localhost:3000').strip()
    _origin(frontend, 'FRONTEND_URL', protected)
    if protected and frontend not in origins:
        raise ValueError('FRONTEND_URL must be included in ALLOWED_ORIGINS')

    oauth_client = env.get('GOOGLE_OAUTH_CLIENT_ID', '').strip()
    oauth_secret = env.get('GOOGLE_OAUTH_CLIENT_SECRET', '').strip()
    if protected and (oauth_client or oauth_secret):
        if not oauth_client:
            raise ValueError('GOOGLE_OAUTH_CLIENT_ID is required when OAuth is configured')
        if not oauth_secret:
            raise ValueError('GOOGLE_OAUTH_CLIENT_SECRET is required when OAuth is configured')
        callback = env.get('OAUTH_REDIRECT_URI', '').strip()
        try:
            url = urlsplit(callback)
            _origin(f'{url.scheme}://{url.netloc}', 'OAUTH_REDIRECT_URI', True)
            valid_callback = (url.path == '/auth/google/callback'
                              and not url.query and not url.fragment)
        except ValueError:
            valid_callback = False
        if not valid_callback:
            raise ValueError('OAUTH_REDIRECT_URI must be an HTTPS /auth/google/callback URL')

    return {
        'APP_ENV': stage,
        'DEBUG': debug,
        'SECRET_KEY': key,
        'ALLOWED_ORIGINS': origins,
        # Semua integrasi dibaca di satu tempat agar route tidak bergantung
        # langsung pada environment process.
        'DB_HOST': env.get('DB_HOST', 'localhost'),
        'DB_PORT': env.get('DB_PORT', '3306'),
        'DB_USER': env.get('DB_USER', 'root'),
        'DB_PASSWORD': env.get('DB_PASSWORD', ''),
        'DB_NAME': env.get('DB_NAME', 'plantvision_db'),
        'USE_MOCK_DB': env.get('USE_MOCK_DB', '0').strip().lower() in TRUE_VALUES,
        'SKIP_MODEL_LOAD': env.get('SKIP_MODEL_LOAD', '0').strip().lower() in TRUE_VALUES,
        'MODEL_FILENAME': env.get('MODEL_FILENAME', 'citrus_mobilenetv2_finetuned.h5'),
        'GEMINI_API_KEY': env.get('GEMINI_API_KEY', ''),
        'GOOGLE_OAUTH_CLIENT_ID': oauth_client,
        'GOOGLE_OAUTH_CLIENT_SECRET': oauth_secret,
        'OAUTH_REDIRECT_URI': env.get(
            'OAUTH_REDIRECT_URI', 'http://localhost:5000/auth/google/callback'),
        'FRONTEND_URL': frontend,
        'SMTP_HOST': env.get('SMTP_HOST', 'smtp.gmail.com'),
        'SMTP_PORT': int(env.get('SMTP_PORT', '587')),
        'SMTP_USER': env.get('SMTP_USER', ''),
        'SMTP_PASSWORD': env.get('SMTP_PASSWORD', ''),
        'SMTP_FROM_NAME': env.get('SMTP_FROM_NAME', 'PlantVision'),
        'SESSION_COOKIE_HTTPONLY': True,
        'SESSION_COOKIE_SECURE': protected,
        'SESSION_COOKIE_SAMESITE': 'Lax',
        'SESSION_COOKIE_NAME': 'plantvision_oauth_state',
        # Cookie Flask di atas hanya untuk state OAuth. Sesi API memakai nama
        # terpisah agar token autentikasi tidak pernah dapat dibaca JavaScript.
        'AUTH_COOKIE_NAME': 'plantvision_session',
        'CSRF_COOKIE_NAME': 'plantvision_csrf',
        'AUTH_ALLOW_BEARER': not protected,
        'MAX_CONTENT_LENGTH': max_upload_mb * 1024 * 1024,
    }
