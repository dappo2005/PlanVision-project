from _safe_config import required_env
import mysql.connector

try:
    print("Mencoba koneksi ke database...")
    conn = mysql.connector.connect(
        host='localhost',
        port='3306',
        user=required_env('DB_USER'),
        password=required_env('DB_PASSWORD'),
        database='plantvision_db'
    )
    
    cursor = conn.cursor()
    
    # Tampilkan struktur tabel
    print("\nStruktur tabel User:")
    cursor.execute("DESCRIBE User")
    for column in cursor.fetchall():
        print(f"Kolom: {column[0]}, Tipe: {column[1]}")
        
except Exception as e:
    print(f'Error: {str(e)}')
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
        print("\nKoneksi database ditutup.")

