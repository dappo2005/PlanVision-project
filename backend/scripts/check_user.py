import mysql.connector

try:
    print("Mencoba koneksi ke database...")
    conn = mysql.connector.connect(
        host='localhost',
        port='3306',
        user='root',
        password='D@ffa_2005',
        database='plantvision_db'
    )
    
    cursor = conn.cursor(dictionary=True)
    
    # Cek user spesifik
    username = 'petani_budi'
    cursor.execute('SELECT id, nama, username, password, role FROM User WHERE username = %s', (username,))
    user = cursor.fetchone()
    
    if user:
        print("\nData User yang ditemukan:")
        print(f"ID: {user['id']}")
        print(f"Nama: {user['nama']}")
        print(f"Username: {user['username']}")
        print(f"Password Hash: {user['password']}")
        print(f"Role: {user['role']}")
    else:
        print(f"\nUser dengan username '{username}' tidak ditemukan!")
        
    # Tampilkan semua user
    print("\nDaftar semua user:")
    cursor.execute('SELECT id, nama, username, role FROM User')
    users = cursor.fetchall()
    for user in users:
        print(f"ID: {user['id']}, Nama: {user['nama']}, Username: {user['username']}, Role: {user['role']}")
        
except Exception as e:
    print(f'Error: {str(e)}')
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
        print("\nKoneksi database ditutup.")

