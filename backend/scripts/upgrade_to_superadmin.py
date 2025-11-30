import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database config
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

print("=" * 60)
print("UPGRADE USER TO SUPERADMIN")
print("=" * 60)

# Masukkan email atau user_id yang ingin diupgrade
target_email = input("\nMasukkan EMAIL user yang ingin dijadikan superadmin: ").strip()

if not target_email:
    print("❌ Email tidak boleh kosong!")
    exit(1)

try:
    # Connect to database
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    cursor = conn.cursor(dictionary=True)
    
    # Cek user exist
    cursor.execute("SELECT user_id, email, nama, role FROM User WHERE email = %s", (target_email,))
    user = cursor.fetchone()
    
    if not user:
        print(f"❌ User dengan email '{target_email}' tidak ditemukan!")
        cursor.close()
        conn.close()
        exit(1)
    
    print(f"\n📋 User ditemukan:")
    print(f"  User ID : {user['user_id']}")
    print(f"  Nama    : {user['nama']}")
    print(f"  Email   : {user['email']}")
    print(f"  Role    : {user['role']}")
    
    if user['role'] == 'superadmin':
        print("\n✅ User ini sudah superadmin!")
        cursor.close()
        conn.close()
        exit(0)
    
    # Konfirmasi
    confirm = input(f"\n⚠️  Ubah role menjadi 'superadmin'? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("❌ Dibatalkan!")
        cursor.close()
        conn.close()
        exit(0)
    
    # Update role
    cursor.execute("UPDATE User SET role = 'superadmin' WHERE user_id = %s", (user['user_id'],))
    conn.commit()
    
    print(f"\n✅ Berhasil! User '{user['nama']}' sekarang adalah superadmin")
    print(f"   Silakan logout dan login ulang untuk menerapkan perubahan.")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"❌ Database error: {err}")
except Exception as e:
    print(f"❌ Error: {e}")
