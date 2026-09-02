#!/usr/bin/env python3
"""
Setup MySQL Database untuk PlantVision
Baca SQL scripts dan eksekusi untuk membuat database dan tables
"""
import mysql.connector
from mysql.connector import Error
import os
import sys

# Database config
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

# Load .env if exists
try:
    from dotenv import load_dotenv
    load_dotenv()
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
    DB_NAME = os.getenv('DB_NAME', 'plantvision_db')
except:
    pass

BASE_DIR = os.path.dirname(__file__)
SQL_FILES = [
    os.path.join(BASE_DIR, 'db/setup_database.sql'),
    os.path.join(BASE_DIR, 'db/setup_feedback.sql'),
    os.path.join(BASE_DIR, 'db/setup_news.sql'),
]

def _has_existing_data(connection, db_name: str) -> dict:
    """Cek apakah DB sudah berisi data penting sebelum setup (untuk warning)."""
    try:
        cur = connection.cursor()
        # Cek apakah database ada
        cur.execute("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME=%s", (db_name,))
        if not cur.fetchone():
            cur.close()
            return {}
        # Cek hitungan baris untuk tabel kritis
        counts = {}
        for tbl in ["User", "DetectionHistory", "Feedback", "News"]:
            try:
                cur.execute(f"SELECT COUNT(*) FROM `{db_name}`.`{tbl}`")
                row = cur.fetchone()
                counts[tbl] = row[0] if row else 0
            except Error:
                counts[tbl] = -1  # tabel belum ada
        cur.close()
        return counts
    except Exception:
        return {}

def execute_sql_file(connection, filepath):
    """Baca dan eksekusi SQL file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Guard: blokir DROP TABLE yang destruktif kecuali --force
        force = "--force" in sys.argv or os.getenv("FORCE_DB_RESET") == "1"
        if not force and "DROP TABLE" in sql.upper():
            print(f"  [WARN] SKIP DROP in {filepath}: gunakan --force atau FORCE_DB_RESET=1 untuk reset paksa")
            # Filter baris DROP TABLE agar tidak tereksekusi
            filtered_lines = []
            for line in sql.splitlines():
                if "DROP TABLE" in line.upper():
                    filtered_lines.append(f"-- SKIPPED (safe mode): {line}")
                else:
                    filtered_lines.append(line)
            sql = "\n".join(filtered_lines)
        
        cursor = connection.cursor()
        # Split by ; untuk multiple statements
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        for statement in statements:
            # Skip komentar murni
            stripped = statement.strip()
            if not stripped or (stripped.startswith("--") and "\n" not in statement):
                continue
            # Skip statement yang sudah di-mark SKIPPED tapi masih mengandung DROP
            if "SKIPPED (safe mode)" in statement:
                print(f"  -- Skipped DROP statement")
                continue
            print(f"  Executing: {statement[:80].replace(chr(10),' ')}...")
            cursor.execute(statement)
            # Consume unread results untuk SELECT/DESCRIBE/SHOW agar next execute tidak error
            try:
                # jika ada result set, buang
                if cursor.with_rows:
                    cursor.fetchall()
                # consume nextset jika ada
                while cursor.nextset():
                    pass
            except Exception:
                pass
            connection.commit()
        
        cursor.close()
        print(f"[OK] {filepath} selesai")
        return True
    except Error as e:
        print(f"[FAIL] Error di {filepath}: {e}")
        return False
    except FileNotFoundError:
        print(f"[FAIL] File tidak ditemukan: {filepath}")
        return False

def main():
    print("=" * 60)
    print("MySQL Database Setup untuk PlantVision")
    print("=" * 60)
    print(f"Host: {DB_HOST}:{DB_PORT}")
    print(f"User: {DB_USER}")
    print(f"Database: {DB_NAME}")
    print()
    
    try:
        # Koneksi ke MySQL (tanpa database spesifik dulu)
        print("[1/3] Connecting to MySQL server...")
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        print("[OK] Connected to MySQL")

        # Safety check: tampilkan data existing sebelum eksekusi
        counts = _has_existing_data(connection, DB_NAME)
        if counts:
            has_data = any(v > 0 for v in counts.values())
            if has_data:
                print(f"[!] Database '{DB_NAME}' sudah berisi data: {counts}")
                print(f"    Safe mode aktif: DROP TABLE akan di-SKIP. Gunakan --force untuk reset paksa.")
                print(f"    Contoh: python setup_db.py --force  atau  $env:FORCE_DB_RESET=1; python setup_db.py")
        
        # Jalankan setup scripts
        print("[2/3] Running SQL setup scripts...")
        for sql_file in SQL_FILES:
            if os.path.exists(sql_file):
                execute_sql_file(connection, sql_file)
        
        connection.close()
        
        # Verifikasi koneksi ke database baru
        print("[3/3] Verifying database connection...")
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        cursor.close()
        connection.close()
        
        print(f"[OK] Database '{DB_NAME}' ready with {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        print("\n" + "=" * 60)
        print("[OK] Database setup COMPLETED successfully!")
        print("=" * 60)
        return 0
        
    except Error as e:
        print(f"\n[FAIL] MySQL Error: {e}")
        print(f"\nTroubleshooting:")
        print(f"  1. Pastikan MySQL Server running")
        print(f"  2. Pastikan credentials benar: {DB_USER}@{DB_HOST}")
        print(f"  3. Cek file .env atau environment variables")
        print("=" * 60)
        return 1
    except Exception as e:
        print(f"\n[FAIL] Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
