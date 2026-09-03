import mysql.connector
import bcrypt
import os
import sys
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

def create_or_upgrade_superadmin():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor(dictionary=True)

        # 1. Upgrade user dappo@gmai.com to superadmin if exists
        cursor.execute("SELECT * FROM User WHERE email = %s", ('dappo@gmai.com',))
        dappo_user = cursor.fetchone()
        if dappo_user:
            cursor.execute("UPDATE User SET role = 'superadmin' WHERE user_id = %s", (dappo_user['user_id'],))
            conn.commit()
            print("[OK] Account 'dappo@gmai.com' has been upgraded to superadmin!")

        # 2. Create standard superadmin account (admin@planvision.com)
        admin_email = 'admin@planvision.com'
        admin_pass = 'admin123'
        
        cursor.execute("SELECT * FROM User WHERE email = %s", (admin_email,))
        existing_admin = cursor.fetchone()

        if existing_admin:
            cursor.execute("UPDATE User SET role = 'superadmin' WHERE user_id = %s", (existing_admin['user_id'],))
            conn.commit()
            print(f"[OK] Account '{admin_email}' already exists and ensured as superadmin!")
        else:
            hashed_pass = bcrypt.hashpw(admin_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            query = """
                INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = ('Super Admin', admin_email, 'superadmin', '081234567890', hashed_pass, 'superadmin', 'aktif', 1)
            cursor.execute(query, values)
            conn.commit()
            print(f"[OK] Created new Superadmin account: '{admin_email}' with password: '{admin_pass}'")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == '__main__':
    create_or_upgrade_superadmin()
