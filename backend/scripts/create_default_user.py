"""
Script untuk membuat user default untuk testing/login
Usage: python create_default_user.py
"""
import mysql.connector
import bcrypt
import os

def create_default_user():
    """Membuat user default untuk testing"""
    try:
        # Konfigurasi database
        config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '3306')),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'plantvision_db')
        }
        
        print("Mencoba koneksi ke database...")
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        
        # Cek apakah user sudah ada
        email = 'cobasaja@example.com'
        cursor.execute("SELECT * FROM User WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"\n⚠️  User dengan email '{email}' sudah ada!")
            print(f"   Username: {existing_user.get('username', 'N/A')}")
            print(f"   Role: {existing_user.get('role', 'N/A')}")
            print("\n✅ Anda bisa login dengan:")
            print(f"   Email: {email}")
            print(f"   Password: admin123")
            return
        
        # Hash password
        password = 'admin123'
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Buat user default
        nama = 'User Test'
        username = 'cobasaja'
        phone = None
        role = 'user'
        status_akun = 'aktif'
        accept_terms = 1
        
        # Cek apakah username sudah ada, jika ya tambahkan angka
        base_username = username
        suffix = 1
        while True:
            cursor.execute("SELECT 1 FROM User WHERE username = %s LIMIT 1", (username,))
            if cursor.fetchone() is None:
                break
            username = f"{base_username}{suffix}"
            suffix += 1
        
        # Insert user
        query = """
            INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (nama, email, username, phone, hashed_password, role, status_akun, accept_terms)
        
        cursor.execute(query, values)
        conn.commit()
        
        user_id = cursor.lastrowid
        print(f"\n✅ User default berhasil dibuat!")
        print(f"\n📋 Informasi Login:")
        print(f"   Email: {email}")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   User ID: {user_id}")
        print(f"   Role: {role}")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Error database: {e}")
        print("\n💡 Tips:")
        print("   1. Pastikan MySQL server berjalan")
        print("   2. Pastikan database 'plantvision_db' sudah dibuat")
        print("   3. Cek konfigurasi database di script ini")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("\n✅ Koneksi database ditutup.")

if __name__ == '__main__':
    create_default_user()

