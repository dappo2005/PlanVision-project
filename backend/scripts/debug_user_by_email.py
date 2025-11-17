import os, json, mysql.connector

def main():
    email = os.environ.get('EMAIL') or (len(os.sys.argv) > 1 and os.sys.argv[1])
    if not email:
        print("Usage: set EMAIL or pass email arg")
        return 1
    cfg = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'D@ffa_2005'),
        'database': os.getenv('DB_NAME', 'plantvision_db'),
        'port': int(os.getenv('DB_PORT', '3306')),
    }
    print(f"[debug] DB='{cfg['database']}' email='{email}'")
    conn = mysql.connector.connect(**cfg)
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT user_id, email, username, CHAR_LENGTH(password) passlen, password, role, status_akun, accept_terms FROM User WHERE email=%s", (email,))
    row = cur.fetchone()
    print(json.dumps(row, indent=2, default=str))
    cur.close(); conn.close()
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
