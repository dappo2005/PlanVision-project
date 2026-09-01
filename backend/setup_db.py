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

SQL_FILES = [
    'db/setup_database.sql',
    'db/setup_feedback.sql',
    'db/setup_news.sql',
]

def execute_sql_file(connection, filepath):
    """Baca dan eksekusi SQL file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        cursor = connection.cursor()
        # Split by ; untuk multiple statements
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        for statement in statements:
            print(f"  Executing: {statement[:60]}...")
            cursor.execute(statement)
            connection.commit()
        
        cursor.close()
        print(f"✓ {filepath} selesai")
        return True
    except Error as e:
        print(f"✗ Error di {filepath}: {e}")
        return False
    except FileNotFoundError:
        print(f"✗ File tidak ditemukan: {filepath}")
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
        print("✓ Connected to MySQL")
        
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
        
        print(f"✓ Database '{DB_NAME}' ready with {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        print("\n" + "=" * 60)
        print("✓ Database setup COMPLETED successfully!")
        print("=" * 60)
        return 0
        
    except Error as e:
        print(f"\n✗ MySQL Error: {e}")
        print(f"\nTroubleshooting:")
        print(f"  1. Pastikan MySQL Server running")
        print(f"  2. Pastikan credentials benar: {DB_USER}@{DB_HOST}")
        print(f"  3. Cek file .env atau environment variables")
        print("=" * 60)
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
