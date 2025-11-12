from flask import Flask, request, jsonify
import mysql.connector
import bcrypt
import os

app = Flask(__name__)

# --- KONFIGURASI KONEKSI DATABASE ---
# Ganti dengan kredensial Anda
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_USER = 'root'
DB_PASSWORD = 'D@ffa_2005'  # GANTI INI
DB_NAME = 'plantvision_db'

def get_db_connection():
    """Fungsi helper untuk membuat koneksi database"""
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# --- API REGISTRASI (F-02) ---
@app.route('/api/register', methods=['POST'])
def register_user():
    """
    API untuk mendaftarkan pengguna baru (Petani).
    Menerima data JSON: nama, email, username, password.
    """
    conn = None
    cursor = None
    try:
        # 1. Ambil data JSON dari request
        data = request.json
        nama = data.get('nama')
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        if not nama or not email or not username or not password:
            return jsonify({"error": "Data tidak lengkap"}), 400

        # 2. Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # 3. Dapatkan koneksi database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
            
        cursor = conn.cursor()

        # 4. Eksekusi query SQL
        query = "INSERT INTO User (nama, email, username, password, role) VALUES (%s, %s, %s, %s, %s)"
        values = (nama, email, username, hashed_password, 'petani')

        cursor.execute(query, values)
        conn.commit()

        # 5. Kirim respons sukses
        return jsonify({"message": f"Registrasi sukses untuk user: {username}"}), 201

    except mysql.connector.Error as err:
        # Tangani error spesifik (misal: duplicate entry)
        if err.errno == 1062:  # Duplicate entry
            return jsonify({"error": "Email atau username sudah terdaftar"}), 409
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # 6. Pastikan koneksi dan kursor ditutup
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


# --- API LOGIN (F-01) ---
@app.route('/api/login', methods=['POST'])
def login_user():
    """
    API untuk login pengguna.
    Menerima data JSON: username, password.
    """
    conn = None
    cursor = None
    try:
        # 1. Ambil data JSON dari request
        data = request.json
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Username dan password diperlukan"}), 400

        # 2. Dapatkan koneksi database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
            
        # Gunakan dictionary=True agar hasil query bisa diakses berdasarkan nama kolom
        cursor = conn.cursor(dictionary=True) 

        # 3. Cari user berdasarkan username
        query = "SELECT * FROM User WHERE username = %s"
        cursor.execute(query, (username,))
        user = cursor.fetchone() # Ambil satu data user

        # 4. Jika user tidak ditemukan
        if not user:
            return jsonify({"error": "Username atau password salah"}), 401 # 401 Unauthorized

        # 5. Bandingkan password
        try:
            # Debug: Print tipe data password dari database
            print(f"Tipe data password dari DB: {type(user['password'])}")
            print(f"Nilai password dari DB: {user['password']}")
            
            # Ambil password hash dari DB
            hashed_password_from_db = user['password']
            
            # Jika password dari DB adalah bytes yang tersimpan sebagai string, konversi kembali ke bytes
            if isinstance(hashed_password_from_db, str):
                try:
                    # Jika password disimpan sebagai string yang merepresentasikan bytes
                    if hashed_password_from_db.startswith("b'") and hashed_password_from_db.endswith("'"):
                        # Hapus b'' dan decode string
                        hashed_password_from_db = eval(hashed_password_from_db)
                    else:
                        hashed_password_from_db = hashed_password_from_db.encode('utf-8')
                except Exception as e:
                    print(f"Error saat mengkonversi password: {str(e)}")
                    raise

            # Debug: Print tipe data setelah konversi
            print(f"Tipe data password setelah konversi: {type(hashed_password_from_db)}")
            
            # Bandingkan password
            password_match = bcrypt.checkpw(password.encode('utf-8'), hashed_password_from_db)
            print(f"Password match: {password_match}")

            if password_match:
                # Password cocok!
                return jsonify({
                    "message": f"Login sukses. Selamat datang, {user['nama']}!",
                    "user_id": user['user_id'],
                    "nama": user['nama'],
                    "role": user['role'],
                    "status": user['status_akun']
                }), 200
            else:
                return jsonify({"error": "Username atau password salah"}), 401
        except Exception as e:
            print(f"Error detail saat verifikasi password: {str(e)}")
            return jsonify({"error": f"Terjadi kesalahan saat verifikasi: {str(e)}"}), 500
        else:
            # Password salah
            return jsonify({"error": "Username atau password salah"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # 6. Pastikan koneksi dan kursor ditutup
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# --- Menjalankan Aplikasi ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)