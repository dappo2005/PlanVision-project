from _safe_config import required_env
import mysql.connector, json, os

CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': required_env('DB_USER'),
    'password': required_env('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'plantvision_db'),
    'port': int(os.getenv('DB_PORT', '3306')),
}

print(f"[verify_users] Using DB='{CONFIG['database']}' on {CONFIG['host']}:{CONFIG.get('port', 3306)} as {CONFIG['user']}")

conn = mysql.connector.connect(**CONFIG)
cur = conn.cursor(dictionary=True)
cur.execute("SELECT user_id, nama, email, username, phone, status_akun, accept_terms, role, tanggal_daftar FROM User ORDER BY user_id DESC LIMIT 5")
rows = cur.fetchall()
print("Last 5 users:")
print(json.dumps(rows, indent=2, default=str))
cur.close(); conn.close()

