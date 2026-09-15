"""Fail-closed runtime configuration: no database or secret files needed."""
import secrets
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from runtime_config import load_runtime_config


class RuntimeConfigTests(unittest.TestCase):
    def production(self):
        return {
            'APP_ENV': 'production',
            'SECRET_KEY': secrets.token_urlsafe(48),
            'DB_HOST': 'db.internal',
            'DB_USER': 'plantvision_app',
            'DB_PASSWORD': secrets.token_urlsafe(24),
            'DB_NAME': 'plantvision_db',
            'ALLOWED_ORIGINS': 'https://plantvision.example',
            'FRONTEND_URL': 'https://plantvision.example',
        }

    def test_production_requires_every_security_setting(self):
        for field in ('SECRET_KEY', 'DB_HOST', 'DB_USER', 'DB_PASSWORD',
                      'DB_NAME', 'ALLOWED_ORIGINS', 'FRONTEND_URL'):
            with self.subTest(field=field):
                env = self.production()
                del env[field]
                with self.assertRaisesRegex(ValueError, field):
                    load_runtime_config(env)

    def test_production_blocks_debug_mock_and_skip_model(self):
        for field in ('FLASK_DEBUG', 'USE_MOCK_DB', 'SKIP_MODEL_LOAD'):
            for value in ('1', 'true', 'TRUE', 'yes', 'on'):
                with self.subTest(field=field, value=value):
                    env = self.production()
                    env[field] = value
                    with self.assertRaisesRegex(ValueError, field):
                        load_runtime_config(env)

    def test_production_origin_is_exact_https_not_regex_or_path(self):
        for origin in ('*', 'https://*.example', 'http://plantvision.example',
                       'https://plantvision.example/path', 'https://user:pass@example.com',
                       'https://example.com?query=1', 'https://example.com/#fragment',
                       'https://example[.]com', 'https://example.com,'):
            with self.subTest(origin=origin):
                env = self.production()
                env['ALLOWED_ORIGINS'] = origin
                with self.assertRaisesRegex(ValueError, 'ALLOWED_ORIGINS'):
                    load_runtime_config(env)

    def test_production_frontend_must_be_allowed(self):
        env = self.production()
        env['FRONTEND_URL'] = 'https://untrusted.example'
        with self.assertRaisesRegex(ValueError, 'FRONTEND_URL'):
            load_runtime_config(env)

    def test_production_rejects_placeholder_and_short_secret(self):
        for key in ('short', 'x' * 64, 'your-secret-key-change-this-before-deploy',
                    'replace-with-a-random-secret-key-at-least-32-chars'):
            env = self.production()
            env['SECRET_KEY'] = key
            with self.assertRaisesRegex(ValueError, 'SECRET_KEY'):
                load_runtime_config(env)

    def test_errors_do_not_echo_secret_values(self):
        env = self.production()
        env['SECRET_KEY'] = 'private-short'
        with self.assertRaises(ValueError) as caught:
            load_runtime_config(env)
        self.assertNotIn('private-short', str(caught.exception))

    def test_production_rejects_database_placeholder(self):
        for placeholder in ('your_password', 'CHANGE_ME', 'replace-with-db-password'):
            env = self.production()
            env['DB_PASSWORD'] = placeholder
            with self.assertRaisesRegex(ValueError, 'DB_PASSWORD'):
                load_runtime_config(env)

    def test_development_is_explicit_and_debug_off_by_default(self):
        result = load_runtime_config({})
        self.assertEqual(result['APP_ENV'], 'development')
        self.assertFalse(result['DEBUG'])
        self.assertNotIn('*', result['ALLOWED_ORIGINS'])
        self.assertGreaterEqual(len(result['SECRET_KEY']), 32)
        self.assertTrue(result['SESSION_COOKIE_HTTPONLY'])
        self.assertEqual(result['SESSION_COOKIE_SAMESITE'], 'Lax')

    def test_valid_production_and_staging_use_secure_cookie(self):
        for stage in ('production', 'staging'):
            env = self.production()
            env['APP_ENV'] = stage
            env['ALLOWED_ORIGINS'] += ', https://admin.example'
            result = load_runtime_config(env)
            self.assertTrue(result['SESSION_COOKIE_SECURE'])
            self.assertFalse(result['DEBUG'])
            self.assertEqual(result['ALLOWED_ORIGINS'], [
                'https://plantvision.example', 'https://admin.example'])
            self.assertEqual(result['SECRET_KEY'], env['SECRET_KEY'])

    def test_unknown_stage_and_production_downgrade_are_rejected(self):
        for env in ({'APP_ENV': 'prodction'},
                    {'APP_ENV': 'development', 'FLASK_ENV': 'production'}):
            with self.assertRaisesRegex(ValueError, 'APP_ENV'):
                load_runtime_config(env)

    def test_legacy_production_env_is_not_silently_development(self):
        with self.assertRaisesRegex(ValueError, 'SECRET_KEY'):
            load_runtime_config({'FLASK_ENV': 'production'})

    def test_configured_oauth_requires_secure_matching_callback_path(self):
        for uri in ('http://backend.example/auth/google/callback',
                    'https://backend.example/wrong',
                    'https://backend.example/auth/google/callback?foo=bar', ''):
            env = self.production()
            env.update(GOOGLE_OAUTH_CLIENT_ID='test-client',
                       GOOGLE_OAUTH_CLIENT_SECRET=secrets.token_urlsafe(32),
                       OAUTH_REDIRECT_URI=uri)
            with self.assertRaisesRegex(ValueError, 'OAUTH_REDIRECT_URI'):
                load_runtime_config(env)

    def test_incomplete_oauth_configuration_is_rejected(self):
        env = self.production()
        env['GOOGLE_OAUTH_CLIENT_ID'] = 'test-client'
        with self.assertRaisesRegex(ValueError, 'GOOGLE_OAUTH_CLIENT_SECRET'):
            load_runtime_config(env)


if __name__ == '__main__':
    unittest.main()
