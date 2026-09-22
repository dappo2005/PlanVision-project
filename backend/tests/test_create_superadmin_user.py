"""Regression tests for the safe, operator-driven superadmin seed script."""
import sys
from pathlib import Path

import mysql.connector

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS_DIR))
import create_superadmin_user as seed_admin


class FakeCursor:
    def __init__(self, existing=False, fail_insert=False):
        self.existing = existing
        self.fail_insert = fail_insert
        self.statements = []
        self.closed = False

    def execute(self, query, params):
        self.statements.append((query, params))
        if self.fail_insert and query.startswith('INSERT'):
            raise mysql.connector.Error('simulated insert failure')

    def fetchone(self):
        return {'user_id': 99} if self.existing else None

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self, existing=False, fail_insert=False):
        self.fake_cursor = FakeCursor(existing, fail_insert)
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def cursor(self, dictionary=False):
        return self.fake_cursor

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


def configure(monkeypatch, password='Strong-test-password-123'):
    monkeypatch.setattr(seed_admin, 'load_dotenv', lambda: None)
    monkeypatch.setenv('DB_USER', 'test-user')
    monkeypatch.setenv('DB_PASSWORD', 'test-db-password')
    monkeypatch.setenv('SEED_ADMIN_EMAIL', 'admin@example.com')
    monkeypatch.setenv('SEED_ADMIN_USERNAME', 'plantvision.id')
    monkeypatch.setenv('SEED_ADMIN_PASSWORD', password)


def test_custom_admin_name_is_inserted(monkeypatch):
    configure(monkeypatch)
    monkeypatch.setenv('SEED_ADMIN_NAME', '@plantvision.id')
    connection = FakeConnection()
    monkeypatch.setattr(seed_admin.mysql.connector, 'connect', lambda **_kwargs: connection)

    assert seed_admin.create_or_upgrade_superadmin() == 0
    insert_params = connection.fake_cursor.statements[-1][1]
    assert insert_params[0] == '@plantvision.id'
    assert insert_params[1:3] == ('admin@example.com', 'plantvision.id')
    assert insert_params[5:7] == ('superadmin', 'aktif')
    assert str(insert_params[4]).startswith('$2')
    assert connection.committed


def test_default_name_remains_compatible(monkeypatch):
    configure(monkeypatch)
    monkeypatch.delenv('SEED_ADMIN_NAME', raising=False)
    connection = FakeConnection()
    monkeypatch.setattr(seed_admin.mysql.connector, 'connect', lambda **_kwargs: connection)

    assert seed_admin.create_or_upgrade_superadmin() == 0
    assert connection.fake_cursor.statements[-1][1][0] == 'Administrator'


def test_duplicate_account_is_not_modified(monkeypatch):
    configure(monkeypatch)
    connection = FakeConnection(existing=True)
    monkeypatch.setattr(seed_admin.mysql.connector, 'connect', lambda **_kwargs: connection)

    assert seed_admin.create_or_upgrade_superadmin() == 1
    assert len(connection.fake_cursor.statements) == 1
    assert not connection.committed


def test_short_password_is_rejected_before_insert(monkeypatch):
    configure(monkeypatch, password='too-short')
    connection = FakeConnection()
    monkeypatch.setattr(seed_admin.mysql.connector, 'connect', lambda **_kwargs: connection)

    assert seed_admin.create_or_upgrade_superadmin() == 1
    assert len(connection.fake_cursor.statements) == 1
    assert not connection.committed


def test_database_failure_rolls_back(monkeypatch):
    configure(monkeypatch)
    connection = FakeConnection(fail_insert=True)
    monkeypatch.setattr(seed_admin.mysql.connector, 'connect', lambda **_kwargs: connection)

    assert seed_admin.create_or_upgrade_superadmin() == 1
    assert connection.rolled_back
    assert not connection.committed
