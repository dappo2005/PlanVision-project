import mysql.connector

print("Mencoba menghubungkan ke MySQL...")
try:
    # Pertama coba koneksi tanpa database
    print("Langkah 1: Mencoba koneksi ke MySQL server...")
    connection = mysql.connector.connect(
        host='localhost',
        port='3306',
        user='root',
        password='D@ffa_2005'
    )
    
    if connection.is_connected():
        db_info = connection.get_server_info()
        print("✅ Berhasil terhubung ke MySQL Server versi", db_info)
        
        # Mencoba membuat database jika belum ada
        print("\nLangkah 2: Mencoba membuat database...")
        cursor = connection.cursor()
        cursor.execute("CREATE DATABASE IF NOT EXISTS plantvision_db")
        print("✅ Database plantvision_db berhasil dibuat atau sudah ada")
        
        # Beralih ke database plantvision_db
        print("\nLangkah 3: Mencoba menggunakan database plantvision_db...")
        cursor.execute("USE plantvision_db")
        print("✅ Berhasil menggunakan database plantvision_db")
        
        # Membuat tabel User jika belum ada
        print("\nLangkah 4: Mencoba membuat tabel User...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS User (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Tabel User berhasil dibuat atau sudah ada")
        
except mysql.connector.Error as e:
    print("Error saat menghubungi MySQL", e)
finally:
    if 'connection' in locals() and connection.is_connected():
        cursor.close()
        connection.close()
        print("Koneksi MySQL ditutup")