from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import mysql.connector
import bcrypt
import os
import tensorflow as tf
import numpy as np
import time
from PIL import Image
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS untuk semua routes
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Load ML model at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'efficientnet_saved', 'saved_model')
MODEL = None
CLASS_NAMES = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']

def load_model():
    """Load SavedModel dari disk"""
    global MODEL
    try:
        if os.path.exists(MODEL_PATH):
            print(f"Loading model from {MODEL_PATH}")
            MODEL = tf.saved_model.load(MODEL_PATH)
            print("Model loaded successfully!")
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")

# Load model saat Flask startup
load_model()

# --- KONFIGURASI KONEKSI DATABASE ---
# Bisa dikonfigurasi melalui environment variables agar konsisten dengan DB Anda
# Contoh (PowerShell): $env:DB_NAME = "planvision"
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

print(f"[Backend] Connecting to MySQL DB='{DB_NAME}' on {DB_HOST}:{DB_PORT} as {DB_USER}")

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

def generate_unique_username(base: str, cursor) -> str:
    """Generate username unik berdasarkan base (tanpa domain). Tambah angka jika bentrok."""
    # Bersihkan base ke huruf/angka/underscore
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', base.lower()) or 'user'
    candidate = cleaned
    suffix = 1
    while True:
        cursor.execute("SELECT 1 FROM User WHERE username=%s LIMIT 1", (candidate,))
        if cursor.fetchone() is None:
            return candidate
        candidate = f"{cleaned}{suffix}"
        suffix += 1

# --- API REGISTRASI (F-02) ---
@app.route('/api/register', methods=['POST'])
def register_user():
    """
    API untuk mendaftarkan pengguna baru (Petani).
    Menerima data JSON: nama, email, username, phone, password.
    """
    conn = None
    cursor = None
    try:
        # 1. Ambil data JSON dari request
        data = request.json
        nama = data.get('nama')
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')
        accept_terms = data.get('acceptTerms')  # Boolean dari frontend
        
        # Validasi fields yang wajib
        if not nama or not email or not password:
            return jsonify({"error": "Nama, email, dan password wajib diisi"}), 400
        if not isinstance(accept_terms, bool) or not accept_terms:
            return jsonify({"error": "Syarat & ketentuan harus disetujui (acceptTerms)"}), 400

        # 2. Hash password
        # Bcrypt menghasilkan bytes ASCII -> simpan sebagai string supaya login sederhana
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # 3. Dapatkan koneksi database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
            
        cursor = conn.cursor()

        # 4. Buat username unik (frontend tidak menyediakan eksplisit username)
        email_local_part = (email.split('@')[0]) if '@' in email else email
        username = generate_unique_username(email_local_part, cursor)

        # 5. Eksekusi query SQL termasuk accept_terms
        query = "INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        values = (nama, email, username, phone or None, hashed_password, 'user', 'aktif', 1)

        cursor.execute(query, values)
        conn.commit()

        # 5. Kirim respons sukses
        user_id = cursor.lastrowid
        return jsonify({
            "message": f"Registrasi sukses untuk user: {username}",
            "user_id": user_id,
            "nama": nama,
            "email": email,
            "username": username,
            "phone": phone,
            "accept_terms": True,
            "status_akun": "aktif",
            "role": "user"
        }), 201

    except mysql.connector.Error as err:
        # Tangani error spesifik (misal: duplicate entry)
        if err.errno == 1062:  # Duplicate entry
            field = "Email" if "email" in str(err) else "Username"
            return jsonify({"error": f"{field} sudah terdaftar"}), 409
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
        username_or_email = data.get('username')  # frontend kirim email di field ini
        password = data.get('password')

        if not username_or_email or not password:
            return jsonify({"error": "Username/email dan password diperlukan"}), 400

        # 2. Dapatkan koneksi database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
            
        # Gunakan dictionary=True agar hasil query bisa diakses berdasarkan nama kolom
        cursor = conn.cursor(dictionary=True) 

        # 3. Cari user baik dengan email maupun username (lebih toleran)
        username_or_email = username_or_email.strip()
        query = "SELECT * FROM User WHERE email = %s OR username = %s"
        cursor.execute(query, (username_or_email, username_or_email))
        user = cursor.fetchone() # Ambil satu data user
        try:
            print(f"[Login] DB='{DB_NAME}', found={bool(user)} for '{username_or_email}'")
        except Exception:
            pass

        # 4. Jika user tidak ditemukan
        if not user:
            return jsonify({"error": "Username atau password salah"}), 401 # 401 Unauthorized

        # 5. Bandingkan password
        try:
            # Debug: Print tipe data password dari database
            # Ambil password hash (sudah disimpan sebagai string ASCII)
            stored_hash = user['password']
            password_match = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
            print(f"Password match: {password_match}")

            if password_match:
                # Password cocok!
                user_id_val = user.get('user_id') or user.get('id')
                status_val = user.get('status_akun') or user.get('status') or 'aktif'
                return jsonify({
                    "message": f"Login sukses. Selamat datang, {user['nama']}!",
                    "user_id": user_id_val,
                    "nama": user['nama'],
                    "email": user['email'],
                    "username": user['username'],
                    "phone": user['phone'],
                    "role": user['role'],
                    "status": status_val
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


# --- API PREDIKSI (F-08) ---
@app.route('/api/predict', methods=['POST'])
def predict_disease():
    """
    API untuk memprediksi penyakit daun berdasarkan gambar.
    Menerima: multipart/form-data dengan key 'image'
    Mengembalikan: JSON dengan predictions, top_class, dan inference_time_ms
    """
    if MODEL is None:
        return jsonify({"error": "Model belum dimuat. Silakan coba lagi."}), 500
    
    try:
        # 1. Periksa apakah ada file 'image' dalam request
        if 'image' not in request.files:
            return jsonify({"error": "File 'image' diperlukan"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "File tidak dipilih"}), 400
        
        # 2. Baca dan preprocess gambar
        start_time = time.time()
        
        img = Image.open(io.BytesIO(file.read())).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0  # Normalize ke [0, 1]
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # 3. Jalankan inference
        infer = MODEL.signatures["serving_default"]
        output = infer(tf.constant(img_array, dtype=tf.float32))
        
        # Get predictions dari output
        predictions_raw = output['dense_2'].numpy()[0]  # logits atau probabilities
        
        # Softmax untuk normalize jika belum
        from scipy.special import softmax
        predictions = softmax(predictions_raw)
        
        # 4. Get top 3 predictions
        top_indices = np.argsort(predictions)[::-1][:3]
        
        predictions_list = []
        for idx in top_indices:
            predictions_list.append({
                "class": CLASS_NAMES[idx],
                "probability": float(predictions[idx])
            })
        
        inference_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # 5. Return response
        return jsonify({
            "predictions": predictions_list,
            "top_class": predictions_list[0]["class"],
            "top_probability": predictions_list[0]["probability"],
            "inference_time_ms": round(inference_time, 2)
        }), 200
        
    except Exception as e:
        print(f"Error in predict_disease: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# --- Menjalankan Aplikasi ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, port=port)