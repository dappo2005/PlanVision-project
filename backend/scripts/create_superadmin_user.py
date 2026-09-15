"""Create an operator-selected superadmin; never promote an unrelated account.

This script writes to MySQL. Existing accounts are left unchanged; use the
separate, confirmation-gated upgrade_to_superadmin.py for an intentional upgrade.
"""
import os
import bcrypt
import mysql.connector
from dotenv import load_dotenv
from _safe_config import required_env, new_account_password


def create_or_upgrade_superadmin():
    load_dotenv()
    conn = None
    cursor = None
    try:
        config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '3306')),
            'user': required_env('DB_USER'),
            'password': required_env('DB_PASSWORD'),
            'database': os.getenv('DB_NAME', 'plantvision_db'),
        }
        admin_email = required_env('SEED_ADMIN_EMAIL')
        admin_username = required_env('SEED_ADMIN_USERNAME')
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT user_id FROM User WHERE email = %s OR username = %s',
                       (admin_email, admin_username))
        if cursor.fetchone():
            print('Account already exists; no role or password was changed.')
            return 1
        admin_password = new_account_password('SEED_ADMIN_PASSWORD')
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            'INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
            ('Administrator', admin_email, admin_username, None, hashed_password, 'superadmin', 'aktif', 1),
        )
        conn.commit()
        print('Superadmin created. Use the privately supplied password; it is not logged.')
        return 0
    except ValueError as exc:
        # Validation messages contain field names only, never values.
        print(f'Configuration error: {exc}')
        return 1
    except mysql.connector.Error:
        if conn is not None:
            conn.rollback()
        print('Database operation failed; check schema and configured connection privately.')
        return 1
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


if __name__ == '__main__':
    raise SystemExit(create_or_upgrade_superadmin())
