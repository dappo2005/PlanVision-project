from flask import Flask, request, jsonify, send_from_directory, redirect
from werkzeug.utils import secure_filename
import mysql.connector
import bcrypt
import os
import tensorflow as tf
from tensorflow.keras.models import load_model as keras_load_model
import numpy as np
import time
from PIL import Image
import io
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import hashlib
import secrets
from disease_info import get_disease_info
from dotenv import load_dotenv
import google.generativeai as genai

# Import mock database untuk fallback
try:
    from mock_db import mock_db
    MOCK_DB_AVAILABLE = True
except ImportError:
    MOCK_DB_AVAILABLE = False

app = Flask(__name__)

# CORS Configuration - allow specific origins in production
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
if '*' in ALLOWED_ORIGINS or os.getenv('FLASK_ENV') == 'development':
    CORS(app)  # Allow all origins in development
else:
    CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Load environment variables
load_dotenv()

# Secret key untuk keamanan sesi & signing (wajib untuk OAuth callback/session)
app.secret_key = os.getenv('SECRET_KEY') or secrets.token_hex(32)

# Upload folder configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load ML model at startup
# --- INTEGRATION: Load the model (supports MobileNetV2 and EfficientNet) ---
MODEL_FILENAME = os.getenv('MODEL_FILENAME', 'citrus_mobilenetv2_finetuned.h5')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', MODEL_FILENAME)
if not os.path.exists(MODEL_PATH):
    # Fallback jika model yang ditentukan belum ada
    for alt_name in ['citrus_mobilenetv2_finetuned.h5', 'citrus_efficientnet_finetuned.h5']:
        alt_path = os.path.join(os.path.dirname(__file__), '..', 'models', alt_name)
        if os.path.exists(alt_path):
            MODEL_PATH = alt_path
            break

MODEL = None
MODEL_TYPE = None  # Will be auto-detected: 'cnn' or 'mobilenetv2'
CLASS_NAMES = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']
IMAGE_SIZE = 256  # Match the training size

def detect_model_type(model):
    """Auto-detect model architecture: mobilenetv2 / efficientnet / cnn"""
    try:
        names = " ".join(layer.name.lower() for layer in model.layers)
        if 'mobilenetv2' in names or 'mobilenet' in names:
            return 'mobilenetv2'
        if 'efficientnet' in names:
            return 'efficientnet'
        return 'cnn'
    except Exception:
        return 'cnn'

def load_model_at_startup():
    """Load Keras H5 model from disk and detect architecture"""
    global MODEL, MODEL_TYPE
    try:
        if os.path.exists(MODEL_PATH):
            print(f"Loading model from {MODEL_PATH}")
            MODEL = keras_load_model(MODEL_PATH)
            MODEL_TYPE = detect_model_type(MODEL)
            print(f"Model loaded successfully! Architecture: {MODEL_TYPE.upper()}")
            print(f"Model input shape: {MODEL.input_shape}")
        else:
            print(f"Warning: Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")

# Load model saat Flask startup (bisa dilewati untuk testing cepat)
if os.getenv('SKIP_MODEL_LOAD') == '1':
    print("[Model] SKIP_MODEL_LOAD=1, melewati load model saat startup")
else:
    load_model_at_startup()

# --- KONFIGURASI AI CHAT (Google Gemini via REST API) ---
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    print("[Gemini] API key berhasil dikonfigurasi")
else:
    print("[Gemini] Peringatan: GEMINI_API_KEY tidak ditemukan di environment/.env")

# --- KONFIGURASI KONEKSI DATABASE ---
# Bisa dikonfigurasi melalui environment variables agar konsisten dengan DB Anda
# Contoh (PowerShell): $env:DB_NAME = "planvision"
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')

# Check database mode
USE_MOCK_DB = os.getenv('USE_MOCK_DB') == '1'
print(f"[Backend] Connecting to MySQL DB='{DB_NAME}' on {DB_HOST}:{DB_PORT} as {DB_USER}")
if USE_MOCK_DB and MOCK_DB_AVAILABLE:
    print("[Database] ⚠️  MOCK DATABASE MODE ENABLED - Using in-memory mock database")
else:
    print("[Database] Using real MySQL database")

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


# ===================================================================
# GOOGLE OAUTH (Login dengan Google)
# ===================================================================
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
OAUTH_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:5000/auth/google/callback')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

if GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET:
    print("[Google OAuth] Dikonfigurasi (login Google aktif)")
else:
    print("[Google OAuth] Peringatan: GOOGLE_OAUTH_CLIENT_ID/SECRET belum diset di .env")

# --- KONFIGURASI EMAIL / SMTP (untuk fitur Lupa Kata Sandi) ---
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME', 'PlantVision')


def send_reset_email(to_email: str, reset_link: str) -> bool:
    """Kirim email berisi link reset password via SMTP (Gmail)."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            print("[Email] SMTP_USER/SMTP_PASSWORD belum diset. Email reset TIDAK dikirim.")
            return False
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'PlantVision - Atur Ulang Kata Sandi Anda'
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
        msg['To'] = to_email
        text = f"""
Halo,

Anda menerima email ini karena kami menerima permintaan untuk mengatur ulang kata sandi akun PlantVision Anda.

Klik tautan berikut untuk mengatur ulang kata sandi Anda (berlaku 15 menit):
{reset_link}

Jika Anda tidak meminta ini, abaikan email ini.

Terima kasih,
Tim PlantVision
"""
        html = f"""
<html><body style="font-family:Arial,sans-serif;background:#f6f7f8;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8eb;">
    <div style="background:#2ECC71;color:#fff;padding:20px 24px;text-align:center;">
      <h2 style="margin:0;">PlantVision</h2>
      <p style="margin:4px 0 0;font-size:14px;">Atur Ulang Kata Sandi</p>
    </div>
    <div style="padding:28px 24px;">
      <p>Halo,</p>
      <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.</p>
      <p>Klik tombol di bawah untuk mengatur ulang kata sandi (berlaku 15 menit):</p>
      <p style="text-align:center;">
        <a href="{reset_link}" style="display:inline-block;background:#2ECC71;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">Atur Ulang Kata Sandi</a>
      </p>
      <p style="font-size:13px;color:#6b7280;">Jika tombol tidak berfungsi, salin tautan ini ke browser:<br>{reset_link}</p>
      <p style="font-size:13px;color:#6b7280;">Jika Anda tidak meminta ini, abaikan email ini.</p>
    </div>
    <div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#9ca3af;text-align:center;">
      © {datetime.now().year} PlantVision | TRK60 G1 - Tim BEBAS
    </div>
  </div>
</body></html>
"""
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        print(f"[Email] Email reset terkirim ke {to_email}")
        return True
    except Exception as e:
        print(f"[Email] Gagal mengirim email: {e}")
        return False


def create_session_token(user_data: dict) -> str:
    """Buat token sesi singkat (HMAC-signed JSON) berisi data user esensial."""
    import hmac
    import base64
    payload = json.dumps({
        "user_id": user_data.get("user_id"),
        "nama": user_data.get("nama"),
        "email": user_data.get("email"),
        "username": user_data.get("username"),
        "role": user_data.get("role"),
        "exp": int(time.time()) + 3600,  # 1 jam
    }).encode('utf-8')
    b64 = base64.urlsafe_b64encode(payload).decode('utf-8').rstrip('=')
    sig = hmac.new(app.secret_key.encode('utf-8'), b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"


def verify_session_token(token: str):
    """Verifikasi token sesi; return dict payload atau None jika tidak valid/kadaluarsa."""
    import hmac
    import base64
    try:
        b64, sig = token.rsplit('.', 1)
        expect = hmac.new(app.secret_key.encode('utf-8'), b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expect):
            return None
        # Tambahkan padding base64 yang dihilangkan
        pad = '=' * (-len(b64) % 4)
        data = json.loads(base64.urlsafe_b64decode(b64 + pad).decode('utf-8'))
        if int(data.get('exp', 0)) < int(time.time()):
            return None
        return data
    except Exception:
        return None


@app.route('/auth/google')
def google_oauth_login():
    """Redirect pengguna ke halaman konsen Google."""
    if not GOOGLE_OAUTH_CLIENT_ID:
        return jsonify({"error": "Google OAuth belum dikonfigurasi"}), 500
    from urllib.parse import urlencode
    params = {
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    return redirect(f"{GOOGLE_AUTH_URL}?{urlencode(params)}", code=302)


@app.route('/auth/google/callback')
def google_oauth_callback():
    """Terima code dari Google, tukar jadi info user, reconcile ke tabel User, redirect ke frontend."""
    import requests as http_requests
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return jsonify({"error": f"Google OAuth error: {error}"}), 400
    if not code:
        return jsonify({"error": "Kode otorisasi tidak ada"}), 400

    # 1. Tukar code -> token
    token_resp = http_requests.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code",
    })
    if token_resp.status_code != 200:
        return jsonify({"error": "Gagal menukar kode Google", "detail": token_resp.text}), 400
    tokens = token_resp.json()
    access_token = tokens.get('access_token')
    if not access_token:
        return jsonify({"error": "Token akses Google tidak diterima"}), 400

    # 2. Ambil info user (email, nama)
    info_resp = http_requests.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if info_resp.status_code != 200:
        return jsonify({"error": "Gagal mengambil profil Google"}), 400
    ginfo = info_resp.json()
    email = (ginfo.get('email') or '').strip().lower()
    nama = ginfo.get('name') or email.split('@')[0]
    if not email:
        return jsonify({"error": "Google tidak mengembalikan email"}), 400

    # 3. Reconcile ke tabel User (login jika ada, auto-register jika belum)
    conn = None
    cursor = None
    try:
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            # Mode mock: reuse register_user (melempar error bila email sudah terdaftar -> anggap login)
            try:
                result = mock_db.register_user(
                    nama=nama, email=email, username=email.split('@')[0],
                    phone=None, password='oauth', accept_terms=True
                )
                user_id = result['user_id']
                role = 'user'
                username = result['username']
                # Tandai sebagai user Google (belum punya password lokal)
                try:
                    mock_db.users[user_id]['provider'] = 'google'
                except Exception:
                    pass
                provider = 'google'
            except Exception:
                mock_user = next((u for u in mock_db.users.values() if u['email'] == email), None)
                user_id = mock_user['user_id'] if mock_user else 0
                role = mock_user.get('role', 'user') if mock_user else 'user'
                username = mock_user.get('username', email.split('@')[0]) if mock_user else email.split('@')[0]
                provider = mock_user.get('provider', 'local') if mock_user else 'google'
        else:
            conn = get_db_connection()
            if conn is None:
                return jsonify({"error": "Koneksi database gagal"}), 500
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT user_id, nama, email, username, role, status_akun, provider FROM User WHERE email=%s LIMIT 1", (email,))
            existing_user = cursor.fetchone()

            if existing_user:
                # Email sudah terdaftar -> login
                user_id = existing_user['user_id']
                role = existing_user['role']
                nama = existing_user['nama'] or nama
                username = existing_user['username']
                provider = existing_user.get('provider') or 'local'
            else:
                # Auto-register akun baru via Google
                username = generate_unique_username(email.split('@')[0], cursor)
                import bcrypt as _bcrypt
                random_password = _bcrypt.hashpw(secrets.token_urlsafe(16).encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')
                cursor.execute(
                    "INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms, provider) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (nama, email, username, None, random_password, 'user', 'aktif', 1, 'google')
                )
                conn.commit()
                user_id = cursor.lastrowid
                role = 'user'
                provider = 'google'

        # 4. Buat token sesi & redirect ke frontend
        token = create_session_token({
            "user_id": user_id,
            "nama": nama,
            "email": email,
            "username": username,
            "role": role,
            "provider": provider,
        })
        redirect_url = f"{FRONTEND_URL}/#/auth?token={token}"
        return redirect(redirect_url, code=302)

    except Exception as e:
        print(f"[Google OAuth] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/auth/session', methods=['POST'])
def auth_session():
    """Verifikasi token sesi OAuth; return data user untuk disimpan di localStorage frontend."""
    data = request.get_json(silent=True) or {}
    token = data.get('token') or request.args.get('token')
    if not token:
        return jsonify({"error": "Token tidak ada"}), 400
    payload = verify_session_token(token)
    if not payload:
        return jsonify({"error": "Token tidak valid atau kadaluarsa"}), 401
    return jsonify(payload), 200


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
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
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

        # [FALLBACK] Try mock database first if enabled
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                result = mock_db.register_user(
                    nama=nama,
                    email=email,
                    username=data.get('username') or email.split('@')[0],
                    phone=phone,
                    password=hashed_password,
                    accept_terms=accept_terms
                )
                return jsonify({
                    "message": result['message'],
                    "username": result['username'],
                    "user_id": result['user_id']
                }), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 400

        # 3. Dapatkan koneksi database (real MySQL)
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
            
        cursor = conn.cursor()

        # 4. Buat username unik (frontend tidak menyediakan eksplisit username)
        email_local_part = (email.split('@')[0]) if '@' in email else email
        username = generate_unique_username(email_local_part, cursor)

        # 5. Eksekusi query SQL termasuk accept_terms
        query = "INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms, provider) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        values = (nama, email, username, phone or None, hashed_password, 'user', 'aktif', 1, 'local')

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
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        username_or_email = data.get('username')  # frontend kirim email di field ini
        password = data.get('password')

        if not username_or_email or not password:
            return jsonify({"error": "Username/email dan password diperlukan"}), 400

        # [FALLBACK] Try mock database first if enabled
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                user = mock_db.login_user(username_or_email, password)
                return jsonify({
                    "message": f"Login sukses. Selamat datang, {user['nama']}!",
                    "user_id": user['user_id'],
                    "nama": user['nama'],
                    "email": user['email'],
                    "username": user['username'],
                    "role": user['role'],
                    "status_akun": user['status_akun'],
                    "provider": user.get('provider', 'local')
                }), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 401

        # 2. Dapatkan koneksi database (real MySQL)
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
            # Type assertion untuk Pylance - cursor dengan dictionary=True mengembalikan dict
            user_data: dict = user  # type: ignore
            stored_hash = str(user_data['password'])
            password_match = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
            print(f"Password match: {password_match}")

            if password_match:
                # Password cocok!
                user_id_val = user_data.get('user_id') or user_data.get('id')
                status_val = user_data.get('status_akun') or user_data.get('status') or 'aktif'
                provider_val = user_data.get('provider') or 'local'
                return jsonify({
                    "message": f"Login sukses. Selamat datang, {user_data['nama']}!",
                    "user_id": user_id_val,
                    "nama": user_data['nama'],
                    "email": user_data['email'],
                    "username": user_data['username'],
                    "phone": user_data['phone'],
                    "role": user_data['role'],
                    "status": status_val,
                    "provider": provider_val
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



# --- API SET PASSWORD (untuk user Google) ---
@app.route('/api/set-password', methods=['POST'])
def set_password():
    """
    Membuat/memperbarui password lokal untuk user (misal user yang daftar via Google).
    Input JSON: { email, new_password }
    """
    conn = None
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        new_password = data.get('new_password') or ''

        if not email:
            return jsonify({"error": "Email wajib diisi"}), 400
        if len(new_password) < 8:
            return jsonify({"error": "Kata sandi minimal 8 karakter"}), 400

        # [FALLBACK] mock db
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                result = mock_db.set_password(email, new_password)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM User WHERE email=%s LIMIT 1", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "Email tidak terdaftar"}), 404

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE User SET password=%s, provider='local' WHERE email=%s", (hashed_password, email))
        conn.commit()
        return jsonify({"message": "Kata sandi berhasil dibuat/diperbarui"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API LUPA KATA SANDI (Lupa Kata Sandi) ---
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """
    Terima email -> generate reset token -> kirim link reset via email.
    Input JSON: { email }
    """
    conn = None
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({"error": "Email wajib diisi"}), 400

        # [FALLBACK] mock db
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                token = secrets.token_urlsafe(32)
                expiry = datetime.now() + timedelta(minutes=15)
                user_info = mock_db.set_reset_token(email, token, expiry)
                link = f"{FRONTEND_URL}/#/reset-password?token={token}"
                sent = send_reset_email(email, link)
                return jsonify({
                    "message": "Jika email terdaftar, tautan reset telah dikirim.",
                    "dev_reset_link": link if not sent else None
                }), 200
            except Exception as e:
                # Jangan bocorkan apakah email ada atau tidak
                print(f"[ForgotPassword] {e}")
                return jsonify({"message": "Jika email terdaftar, tautan reset telah dikirim."}), 200

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM User WHERE email=%s LIMIT 1", (email,))
        user = cursor.fetchone()

        # Selalu kembalikan pesan sama (anti user-enumeration)
        if not user:
            print(f"[ForgotPassword] Email tidak terdaftar: {email}")
            return jsonify({"message": "Jika email terdaftar, tautan reset telah dikirim."}), 200

        token = secrets.token_urlsafe(32)
        expiry = datetime.now() + timedelta(minutes=15)
        # Simpan hash token untuk keamanan ekstra
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        cursor.execute(
            "UPDATE User SET reset_token=%s, reset_token_expiry=%s WHERE email=%s",
            (token_hash, expiry, email)
        )
        conn.commit()

        link = f"{FRONTEND_URL}/#/reset-password?token={token}"
        sent = send_reset_email(email, link)
        return jsonify({
            "message": "Jika email terdaftar, tautan reset telah dikirim.",
            "dev_reset_link": link if not sent else None
        }), 200

    except Exception as e:
        print(f"[ForgotPassword] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API RESET PASSWORD (verifikasi token) ---
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """
    Verifikasi token reset lalu set password baru.
    Input JSON: { token, new_password }
    """
    conn = None
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        token = data.get('token') or ''
        new_password = data.get('new_password') or ''

        if not token:
            return jsonify({"error": "Token tidak ada"}), 400
        if len(new_password) < 8:
            return jsonify({"error": "Kata sandi minimal 8 karakter"}), 400

        # [FALLBACK] mock db
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                result = mock_db.reset_password(token, new_password)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        cursor.execute(
            "SELECT * FROM User WHERE reset_token=%s LIMIT 1",
            (token_hash,)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "Token reset tidak valid"}), 400

        expiry = user.get('reset_token_expiry')
        if not expiry or datetime.now() > expiry:
            return jsonify({"error": "Token reset sudah kedaluwarsa"}), 400

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            "UPDATE User SET password=%s, reset_token=NULL, reset_token_expiry=NULL, provider='local' WHERE user_id=%s",
            (hashed_password, user['user_id'])
        )
        conn.commit()
        return jsonify({"message": "Kata sandi berhasil direset. Silakan masuk."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()



# --- API PREDIKSI (F-08) ---
# Disease info sudah diimport dari disease_info.py (lebih lengkap)

@app.route('/api/predict', methods=['POST'])
def predict_disease():
    if MODEL is None:
        return jsonify({"error": "Model AI belum siap"}), 500

    conn = None
    cursor = None
    try:
        if 'image' not in request.files:
            return jsonify({"error": "Tidak ada gambar"}), 400
        
        file = request.files['image']
        user_id = request.form.get('user_id')
        
        if file.filename == '':
            return jsonify({"error": "Nama file kosong"}), 400

        # 1. Simpan File
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(f"{timestamp}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # 2. PREPROCESSING: SMART CENTER-CROP SQUARE (menghindari border hitam pemicu salah prediksi)
        start_time = time.time()
        img = Image.open(filepath).convert('RGB')
        
        # Potong area tengah (center crop) berbentuk persegi agar tidak ada border hitam yang memicu bias Melanose
        w, h = img.size
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        crop_img = img.crop((left, top, left + min_dim, top + min_dim))
        resized_img = crop_img.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.LANCZOS)
        
        # Konversi ke Array
        img_array = np.array(resized_img).astype(np.float32) 
        
        # Tambah dimensi batch
        img_array = np.expand_dims(img_array, axis=0)

        # 3. Prediksi
        predictions = MODEL.predict(img_array, verbose=0)[0]
        inference_time = (time.time() - start_time) * 1000
        
        # Ambil hasil tertinggi
        top_index = np.argmax(predictions)
        top_class = CLASS_NAMES[top_index]
        top_prob = float(predictions[top_index])
        
        # Debug: Lihat probabilitas semua kelas di terminal
        print(f"[Debug] File: {filename}")
        for i, prob in enumerate(predictions):
            print(f"  - {CLASS_NAMES[i]}: {prob*100:.2f}%")

        # 4. Get disease info
        try:
            disease_info = get_disease_info(top_class)
        except Exception as e:
            print(f"Error getting disease info: {e}")
            disease_info = {}

        # Ambil severity bawaan dari disease_info (biologis), atau fallback
        severity = disease_info.get('severity', 'sedang')

        # 5. Simpan ke Database (REFACTORED: Prioritas DetectionHistory)
        history_id = None
        if user_id:
            # Jika mock mode aktif, simpan ke mock_db (tidak hilang jika MySQL down, tapi tetap in-memory)
            if USE_MOCK_DB and MOCK_DB_AVAILABLE:
                try:
                    md = mock_db.add_detection(
                        user_id=int(user_id), image_path=filename, disease_name=top_class,
                        confidence=top_prob*100, severity=severity,
                        description=disease_info.get('description',''),
                        symptoms=json.dumps(disease_info.get('symptoms',[])),
                        treatment=json.dumps(disease_info.get('treatment',[])),
                        prevention=json.dumps(disease_info.get('prevention',[]))
                    )
                    history_id = md.get('id')
                    print(f"[DetectionHistory Mock] Saved ID: {history_id}")
                except Exception as me:
                    print(f"[DetectionHistory Mock] Error: {me}")
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                
                # NEW: Simpan ke DetectionHistory dengan data lengkap
                try:
                    # Ekstrak data dari disease_info
                    description = disease_info.get('description', '')
                    symptoms = json.dumps(disease_info.get('symptoms', []))
                    treatment = json.dumps(disease_info.get('treatment', []))
                    prevention = json.dumps(disease_info.get('prevention', []))
                    
                    sql_history = """
                        INSERT INTO DetectionHistory 
                        (user_id, image_path, disease_name, confidence, severity, 
                         description, symptoms, treatment, prevention)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(sql_history, (
                        user_id, filename, top_class, top_prob * 100, severity,
                        description, symptoms, treatment, prevention
                    ))
                    history_id = cursor.lastrowid
                    print(f"[DetectionHistory] Saved ID: {history_id}")
                    
                except Exception as e:
                    print(f"[DetectionHistory] Error: {e}")
                    # FALLBACK: Jika DetectionHistory gagal, simpan ke DaunJeruk+Diagnosa
                    try:
                        sql_daun = "INSERT INTO DaunJeruk (user_id, citra) VALUES (%s, %s)"
                        cursor.execute(sql_daun, (user_id, filename))
                        daun_id = cursor.lastrowid
                        
                        hasil_text = f"{top_class} ({top_prob*100:.1f}%)"
                        sql_diag = "INSERT INTO Diagnosa (daun_id, hasil_deteksi) VALUES (%s, %s)"
                        cursor.execute(sql_diag, (daun_id, hasil_text))
                        
                        print(f"[Fallback] Saved to DaunJeruk+Diagnosa")
                    except Exception as fallback_err:
                        print(f"[Fallback] Error: {fallback_err}")
                
                conn.commit()
                
        # 6. Response
        return jsonify({
            "class": top_class,
            "confidence": f"{top_prob*100:.1f}%",
            "inference_time": f"{inference_time:.2f} ms",
            "image_url": f"/api/uploads/{filename}",
            "disease_info": disease_info,
            "history_id": history_id
        }), 200

    except Exception as e:
        print(f"Error Predict: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# --- API DETECTION HISTORY ---
@app.route('/api/detection-history/<int:user_id>', methods=['GET'])
def get_detection_history(user_id):
    """
    API untuk mendapatkan histori deteksi berdasarkan user_id
    Returns: List of detection history sorted by date (newest first)
    """
    conn = None
    cursor = None
    
    try:
        # Mock DB fallback
        if USE_MOCK_DB and MOCK_DB_AVAILABLE:
            try:
                history = mock_db.get_detections(user_id)
                # Normalisasi ke format API
                formatted = []
                for d in history:
                    formatted.append({
                        "id": d.get('id'),
                        "user_id": d.get('user_id'),
                        "image_url": f"/api/uploads/{d.get('image_path')}",
                        "disease_name": d.get('disease_name'),
                        "confidence": float(d.get('confidence', 0)),
                        "severity": d.get('severity'),
                        "description": d.get('description', ''),
                        "symptoms": json.loads(d['symptoms']) if isinstance(d.get('symptoms'), str) and d.get('symptoms') else (d.get('symptoms') or []),
                        "treatment": json.loads(d['treatment']) if isinstance(d.get('treatment'), str) and d.get('treatment') else (d.get('treatment') or []),
                        "prevention": json.loads(d['prevention']) if isinstance(d.get('prevention'), str) and d.get('prevention') else (d.get('prevention') or []),
                        "detection_date": d.get('detection_date')
                    })
                return jsonify({"user_id": user_id, "total": len(formatted), "history": formatted, "source": "mock"}), 200
            except Exception as me:
                print(f"[DetectionHistory Mock] Error: {me}")

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Auto-create DetectionHistory jika belum ada (self-heal, non-destruktif) - cek via INFORMATION_SCHEMA agar tidak unread result
        cursor.execute("SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=%s AND TABLE_NAME='DetectionHistory'", (DB_NAME,))
        tbl_exists = cursor.fetchone()
        exists_cnt = tbl_exists['c'] if tbl_exists else 0  # type: ignore
        if exists_cnt == 0:
            print(f"[DetectionHistory] Tabel belum ada, membuat otomatis")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS DetectionHistory (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    image_path VARCHAR(255) NOT NULL,
                    disease_name VARCHAR(100) NOT NULL,
                    confidence DECIMAL(5, 2) NOT NULL,
                    severity VARCHAR(20) NOT NULL,
                    description TEXT,
                    symptoms TEXT,
                    treatment TEXT,
                    prevention TEXT,
                    detection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
                    INDEX idx_user_date (user_id, detection_date DESC)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            conn.commit()
            return jsonify({"user_id": user_id, "total": 0, "history": [], "warning": "Tabel DetectionHistory baru dibuat, belum ada data"}), 200

        query = """
            SELECT 
                id, user_id, image_path, disease_name, confidence, severity,
                description, symptoms, treatment, prevention, detection_date
            FROM DetectionHistory
            WHERE user_id = %s
            ORDER BY detection_date DESC
        """
        
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()
        
        # Parse JSON fields (tahan terhadap data korup)
        def _safe_json(v):
            if not v:
                return []
            if isinstance(v, list):
                return v
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else [str(parsed)]
            except:
                return [str(v)] if isinstance(v, str) else []

        history = []
        for row in results:
            row_data: dict = row  # type: ignore
            history.append({
                "id": row_data['id'],
                "user_id": row_data['user_id'],
                "image_url": f"/api/uploads/{row_data['image_path']}",
                "disease_name": row_data['disease_name'],
                "confidence": float(row_data['confidence']),
                "severity": row_data['severity'],
                "description": row_data['description'],
                "symptoms": _safe_json(row_data['symptoms']),
                "treatment": _safe_json(row_data['treatment']),
                "prevention": _safe_json(row_data['prevention']),
                "detection_date": row_data['detection_date'].isoformat() if row_data['detection_date'] else None
            })

        # FALLBACK: Jika DetectionHistory kosong, coba baca dari legacy Diagnosa+DaunJeruk (agar data lama tidak dianggap hilang)
        if len(history) == 0:
            try:
                cursor.execute("""
                    SELECT d.daun_id as id, d.user_id, d.citra as image_path, dg.hasil_deteksi, dg.tanggal_diagnosa as detection_date
                    FROM daunjeruk d
                    JOIN diagnosa dg ON d.daun_id = dg.daun_id
                    WHERE d.user_id = %s
                    ORDER BY dg.tanggal_diagnosa DESC
                """, (user_id,))
                legacy = cursor.fetchall()
                if legacy:
                    for row in legacy:
                        rd: dict = row  # type: ignore
                        hasil = rd.get('hasil_deteksi') or ''
                        # Parse: "Citrus Greening (CVPD/Huanglongbing) (94.3%)" -> disease + confidence
                        import re as _re
                        m = _re.search(r'\(([\d\.]+)%\)\s*$', hasil)
                        conf = float(m.group(1)) if m else 0.0
                        disease_raw = _re.sub(r'\s*\([\d\.]+%\)\s*$', '', hasil).strip()
                        # Map old names ke CLASS_NAMES
                        disease_map = {
                            'Citrus Greening (CVPD/Huanglongbing)': 'Greening',
                            'Greening': 'Greening',
                            'Canker': 'Canker',
                            'Black spot': 'Black spot',
                            'Melanose': 'Melanose',
                            'Healthy': 'Healthy',
                        }
                        disease_name = disease_map.get(disease_raw, disease_raw)
                        if conf >= 90:
                            severity = "tinggi"
                        elif conf >= 70:
                            severity = "sedang"
                        else:
                            severity = "rendah"
                        try:
                            dinfo = get_disease_info(disease_name)
                        except:
                            dinfo = {}
                        history.append({
                            "id": rd['id'],
                            "user_id": rd['user_id'],
                            "image_url": f"/api/uploads/{rd['image_path']}",
                            "disease_name": disease_name,
                            "confidence": conf,
                            "severity": severity,
                            "description": dinfo.get('description', ''),
                            "symptoms": dinfo.get('symptoms', []),
                            "treatment": dinfo.get('treatment', []),
                            "prevention": dinfo.get('prevention', []),
                            "detection_date": rd['detection_date'].isoformat() if rd['detection_date'] else None
                        })
                    print(f"[DetectionHistory Fallback] Served {len(history)} legacy records for user {user_id}")
            except Exception as leg_err:
                # Jika tabel legacy tidak ada, abaikan
                if "doesn't exist" not in str(leg_err):
                    print(f"[Fallback Legacy] Error: {leg_err}")
        
        return jsonify({
            "user_id": user_id,
            "total": len(history),
            "history": history,
            "source": "legacy" if len(results)==0 and len(history)>0 else "detection_history"
        }), 200
        
    except Exception as e:
        err_msg = str(e)
        print(f"Error in get_detection_history: {err_msg}")
        # Graceful: jika tabel hilang, jangan 500
        if "doesn't exist" in err_msg:
            return jsonify({"user_id": user_id, "total": 0, "history": [], "warning": "Tabel DetectionHistory belum ada. Jalankan setup_db.py"}), 200
        return jsonify({"error": err_msg}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


# --- API SERVE UPLOADED IMAGES ---
@app.route('/api/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    """
    Serve uploaded images dari folder uploads
    """
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404


# ===================================================================
# FEEDBACK SYSTEM API ENDPOINTS
# ===================================================================

def generate_tracking_code():
    """Generate unique tracking code untuk guest feedback"""
    return secrets.token_hex(16)  # 32 karakter hex string


# --- API SUBMIT FEEDBACK (Guest - Tanpa Login) ---
@app.route('/api/feedback/submit-guest', methods=['POST'])
def submit_feedback_guest():
    """
    API untuk guest mengirim feedback tanpa login
    Body: {nama, email, rating, category, message}
    Returns: {feedback_id, tracking_code, message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        # Validasi required fields
        nama = data.get('nama')
        email = data.get('email')
        rating = data.get('rating')
        category = data.get('category')
        message = data.get('message')
        
        if not all([nama, email, rating, category, message]):
            return jsonify({"error": "Semua field wajib diisi"}), 400
        
        # Validasi rating
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return jsonify({"error": "Rating harus antara 1-5"}), 400
        except ValueError:
            return jsonify({"error": "Rating tidak valid"}), 400
        
        # Validasi category
        valid_categories = ['umum', 'fitur', 'bug', 'desain', 'saran']
        if category not in valid_categories:
            return jsonify({"error": f"Category tidak valid. Pilihan: {', '.join(valid_categories)}"}), 400
        
        # Generate tracking code
        tracking_code = generate_tracking_code()
        
        # Save to database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor()
        
        query = """
            INSERT INTO Feedback 
            (user_id, nama, email, rating, category, message, user_role, status, tracking_code)
            VALUES (NULL, %s, %s, %s, %s, %s, 'guest', 'pending', %s)
        """
        values = (nama, email, rating_int, category, message, tracking_code)
        
        cursor.execute(query, values)
        conn.commit()
        feedback_id = cursor.lastrowid
        
        return jsonify({
            "message": "Feedback berhasil dikirim!",
            "feedback_id": feedback_id,
            "tracking_code": tracking_code,
            "info": "Simpan tracking code ini untuk mengecek status feedback Anda"
        }), 201
        
    except mysql.connector.Error as err:
        print(f"[Feedback Guest] Database error: {err}")
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        print(f"[Feedback Guest] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API SUBMIT FEEDBACK (Authenticated User) ---
@app.route('/api/feedback/submit', methods=['POST'])
def submit_feedback_user():
    """
    API untuk user yang sudah login mengirim feedback
    Body: {user_id, rating, category, message}
    Auto-fill nama & email dari database user
    Returns: {feedback_id, message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        # Validasi required fields
        user_id = data.get('user_id')
        rating = data.get('rating')
        category = data.get('category')
        message = data.get('message')
        
        if not all([user_id, rating, category, message]):
            return jsonify({"error": "user_id, rating, category, dan message wajib diisi"}), 400
        
        # Validasi rating
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return jsonify({"error": "Rating harus antara 1-5"}), 400
        except ValueError:
            return jsonify({"error": "Rating tidak valid"}), 400
        
        # Validasi category
        valid_categories = ['umum', 'fitur', 'bug', 'desain', 'saran']
        if category not in valid_categories:
            return jsonify({"error": f"Category tidak valid"}), 400
        
        # Get user data from database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Cek user exist dan ambil data
        cursor.execute("SELECT user_id, nama, email, role FROM User WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User tidak ditemukan"}), 404
        
        user_data: dict = user  # type: ignore
        nama = user_data['nama']
        email = user_data['email']
        user_role = user_data['role']
        
        # Generate tracking code (optional untuk user, tapi tetap dibuat)
        tracking_code = generate_tracking_code()
        
        # Insert feedback
        query = """
            INSERT INTO Feedback 
            (user_id, nama, email, rating, category, message, user_role, status, tracking_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s)
        """
        values = (user_id, nama, email, rating_int, category, message, user_role, tracking_code)
        
        cursor.execute(query, values)
        conn.commit()
        feedback_id = cursor.lastrowid
        
        return jsonify({
            "message": "Feedback berhasil dikirim!",
            "feedback_id": feedback_id,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }), 201
        
    except mysql.connector.Error as err:
        print(f"[Feedback User] Database error: {err}")
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        print(f"[Feedback User] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET MY FEEDBACKS (User) ---
@app.route('/api/feedback/my-feedbacks/<int:user_id>', methods=['GET'])
def get_my_feedbacks(user_id):
    """
    API untuk user melihat riwayat feedback mereka
    Returns: List of feedbacks with status
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                feedback_id, nama, email, rating, category, message,
                status, priority, created_at, updated_at, resolved_at, admin_notes
            FROM Feedback
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        
        cursor.execute(query, (user_id,))
        feedbacks = cursor.fetchall()
        
        # Format response
        result = []
        for fb in feedbacks:
            fb_data: dict = fb  # type: ignore
            result.append({
                "feedback_id": fb_data['feedback_id'],
                "rating": fb_data['rating'],
                "category": fb_data['category'],
                "message": fb_data['message'],
                "status": fb_data['status'],
                "priority": fb_data['priority'],
                "created_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None,
                "updated_at": fb_data['updated_at'].isoformat() if fb_data['updated_at'] else None,
                "resolved_at": fb_data['resolved_at'].isoformat() if fb_data['resolved_at'] else None,
                "admin_notes": fb_data['admin_notes']
            })
        
        return jsonify({
            "user_id": user_id,
            "total": len(result),
            "feedbacks": result
        }), 200
        
    except Exception as e:
        print(f"[My Feedbacks] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API UPDATE FEEDBACK (User - only pending & < 24 hours) ---
@app.route('/api/feedback/update/<int:feedback_id>', methods=['PUT'])
def update_feedback(feedback_id):
    """
    API untuk user update feedback mereka (hanya jika status=pending dan < 24 jam)
    Body: {user_id, rating, category, message}
    Returns: {success, message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        user_id = data.get('user_id')
        rating = data.get('rating')
        category = data.get('category')
        message = data.get('message')
        
        if not all([user_id, rating, category, message]):
            return jsonify({"error": "Semua field wajib diisi"}), 400
        
        # Validasi rating
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return jsonify({"error": "Rating harus antara 1-5"}), 400
        except ValueError:
            return jsonify({"error": "Rating tidak valid"}), 400
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Check ownership dan status
        cursor.execute("""
            SELECT feedback_id, user_id, status, created_at
            FROM Feedback
            WHERE feedback_id = %s
        """, (feedback_id,))
        
        feedback = cursor.fetchone()
        if not feedback:
            return jsonify({"error": "Feedback tidak ditemukan"}), 404
        
        fb_data: dict = feedback  # type: ignore
        
        # Cek ownership
        if fb_data['user_id'] != int(user_id):
            return jsonify({"error": "Anda tidak memiliki akses untuk mengubah feedback ini"}), 403
        
        # Cek status
        if fb_data['status'] != 'pending':
            return jsonify({"error": f"Feedback dengan status '{fb_data['status']}' tidak dapat diubah"}), 400
        
        # Cek 24 hours rule
        from datetime import timedelta
        created = fb_data['created_at']
        now = datetime.now()
        time_diff = now - created
        
        if time_diff > timedelta(hours=24):
            return jsonify({"error": "Feedback hanya dapat diubah dalam 24 jam pertama"}), 400
        
        # Update feedback
        update_query = """
            UPDATE Feedback
            SET rating = %s, category = %s, message = %s, updated_at = NOW()
            WHERE feedback_id = %s
        """
        cursor.execute(update_query, (rating_int, category, message, feedback_id))
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Feedback berhasil diupdate",
            "feedback_id": feedback_id
        }), 200
        
    except Exception as e:
        print(f"[Update Feedback] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API TRACK FEEDBACK (Guest - via tracking code) ---
@app.route('/api/feedback/track/<tracking_code>', methods=['GET'])
def track_feedback(tracking_code):
    """
    API untuk guest track status feedback via tracking code
    Returns: Feedback details and responses
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                feedback_id, nama, email, rating, category, message,
                status, priority, created_at, updated_at, resolved_at
            FROM Feedback
            WHERE tracking_code = %s
        """
        
        cursor.execute(query, (tracking_code,))
        feedback = cursor.fetchone()
        
        if not feedback:
            return jsonify({"error": "Tracking code tidak valid"}), 404
        
        fb_data: dict = feedback  # type: ignore
        
        # Get responses (non-internal only)
        cursor.execute("""
            SELECT response_text, created_at
            FROM FeedbackResponse
            WHERE feedback_id = %s AND is_internal = 0
            ORDER BY created_at ASC
        """, (fb_data['feedback_id'],))
        
        responses = []
        for resp in cursor.fetchall():
            resp_data: dict = resp  # type: ignore
            responses.append({
                "response": resp_data['response_text'],
                "date": resp_data['created_at'].isoformat() if resp_data['created_at'] else None
            })
        
        return jsonify({
            "feedback_id": fb_data['feedback_id'],
            "rating": fb_data['rating'],
            "category": fb_data['category'],
            "message": fb_data['message'],
            "status": fb_data['status'],
            "submitted_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None,
            "resolved_at": fb_data['resolved_at'].isoformat() if fb_data['resolved_at'] else None,
            "responses": responses
        }), 200
        
    except Exception as e:
        print(f"[Track Feedback] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ===================================================================
# ADMIN FEEDBACK MANAGEMENT API (Superadmin Only)
# ===================================================================

def verify_superadmin(user_id):
    """Helper function to verify if user is superadmin"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return False
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT role FROM User WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if user:
            user_data: dict = user  # type: ignore
            return user_data['role'] == 'superadmin'
        return False
    except Exception as e:
        print(f"[Verify Admin] Error: {e}")
        return False
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET ALL FEEDBACKS (Admin) ---
@app.route('/api/admin/feedbacks', methods=['GET'])
def get_all_feedbacks():
    """
    API untuk admin melihat semua feedback dengan filtering
    Query params: ?status=pending&category=bug&sort=date_desc&page=1&limit=20
    Returns: Paginated list of feedbacks
    """
    conn = None
    cursor = None
    
    try:
        # Get query parameters
        admin_id = request.args.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403
        
        status_filter = request.args.get('status', None)
        category_filter = request.args.get('category', None)
        sort_by = request.args.get('sort', 'date_desc')  # date_desc, date_asc, rating_desc, rating_asc
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        offset = (page - 1) * limit
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Build query with filters
        where_clauses = []
        params = []
        
        if status_filter:
            where_clauses.append("status = %s")
            params.append(status_filter)
        
        if category_filter:
            where_clauses.append("category = %s")
            params.append(category_filter)
        
        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Determine sort order
        if sort_by == 'date_desc':
            order_sql = "ORDER BY created_at DESC"
        elif sort_by == 'date_asc':
            order_sql = "ORDER BY created_at ASC"
        elif sort_by == 'rating_desc':
            order_sql = "ORDER BY rating DESC, created_at DESC"
        elif sort_by == 'rating_asc':
            order_sql = "ORDER BY rating ASC, created_at DESC"
        else:
            order_sql = "ORDER BY created_at DESC"
        
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM Feedback {where_sql}"
        cursor.execute(count_query, params)
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore
        
        # Get feedbacks
        query = f"""
            SELECT 
                feedback_id, user_id, nama, email, rating, category, message,
                user_role, status, priority, created_at, updated_at, 
                resolved_at, resolved_by, admin_notes
            FROM Feedback
            {where_sql}
            {order_sql}
            LIMIT %s OFFSET %s
        """
        
        cursor.execute(query, params + [limit, offset])
        feedbacks = cursor.fetchall()
        
        result = []
        for fb in feedbacks:
            fb_data: dict = fb  # type: ignore
            result.append({
                "feedback_id": fb_data['feedback_id'],
                "user_id": fb_data['user_id'],
                "nama": fb_data['nama'],
                "email": fb_data['email'],
                "rating": fb_data['rating'],
                "category": fb_data['category'],
                "message": fb_data['message'],
                "user_role": fb_data['user_role'],
                "status": fb_data['status'],
                "priority": fb_data['priority'],
                "created_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None,
                "updated_at": fb_data['updated_at'].isoformat() if fb_data['updated_at'] else None,
                "resolved_at": fb_data['resolved_at'].isoformat() if fb_data['resolved_at'] else None,
                "resolved_by": fb_data['resolved_by'],
                "admin_notes": fb_data['admin_notes']
            })
        
        return jsonify({
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
            "feedbacks": result
        }), 200
        
    except Exception as e:
        print(f"[Admin Feedbacks] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET FEEDBACK STATISTICS (Admin) ---
@app.route('/api/admin/feedbacks/stats', methods=['GET'])
def get_feedback_stats():
    """
    API untuk mendapatkan statistik feedback
    Query params: ?admin_id=1
    Returns: {total, pending, by_status, by_category, by_rating}
    """
    conn = None
    cursor = None
    
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Total feedbacks
        cursor.execute("SELECT COUNT(*) as total FROM Feedback")
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore
        
        # Pending feedbacks
        cursor.execute("SELECT COUNT(*) as pending FROM Feedback WHERE status = 'pending'")
        pending_result = cursor.fetchone()
        pending: int = pending_result['pending'] if pending_result else 0  # type: ignore
        
        # By status
        cursor.execute("SELECT status, COUNT(*) as count FROM Feedback GROUP BY status")
        by_status = {row['status']: row['count'] for row in cursor.fetchall()}  # type: ignore
        
        # By category
        cursor.execute("SELECT category, COUNT(*) as count FROM Feedback GROUP BY category")
        by_category = {row['category']: row['count'] for row in cursor.fetchall()}  # type: ignore
        
        # By rating
        cursor.execute("SELECT rating, COUNT(*) as count FROM Feedback GROUP BY rating ORDER BY rating")
        by_rating = {row['rating']: row['count'] for row in cursor.fetchall()}  # type: ignore
        
        # Average rating
        cursor.execute("SELECT AVG(rating) as avg_rating FROM Feedback")
        avg_result = cursor.fetchone()
        avg_rating = float(avg_result['avg_rating']) if avg_result and avg_result['avg_rating'] else 0  # type: ignore
        
        return jsonify({
            "total": total,
            "pending": pending,
            "by_status": by_status,
            "by_category": by_category,
            "by_rating": by_rating,
            "average_rating": round(avg_rating, 2)
        }), 200
        
    except Exception as e:
        print(f"[Feedback Stats] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API CHAT AI ---
@app.route('/api/chat', methods=['POST'])
def chat_ai():
    try:
        data = request.json
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({"error": "Pesan tidak boleh kosong"}), 400

        if not GEMINI_API_KEY:
            return jsonify({"error": "Chat AI belum dikonfigurasi. Set GEMINI_API_KEY di .env"}), 500

        system_prompt = (
            "Anda adalah PlantVision AI, asisten agronomi untuk pertanian jeruk. "
            "Jawab dalam Bahasa Indonesia dengan singkat, praktis, dan sopan. "
            "Fokus pada penyakit daun jeruk: Black spot, Canker, Greening, Melanose, Healthy."
        )

        # Gunakan Google Generative AI REST API dengan endpoint v1 yang lebih stabil
        import requests as req
        
        # Coba berbagai kombinasi endpoint dan model
        endpoints = [
            ("v1", "gemini-1.5-flash"),
            ("v1beta", "gemini-1.5-flash"),
            ("v1beta", "gemini-pro"),
            ("v1", "gemini-pro"),
        ]
        
        prompt_text = f"{system_prompt}\n\nPertanyaan: {user_message}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt_text}]
            }]
        }
        
        reply_text = None
        last_error = None
        
        for version, model_name in endpoints:
            try:
                api_url = f"https://generativelanguage.googleapis.com/{version}/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                resp = req.post(api_url, json=payload, timeout=30)
                resp.raise_for_status()
                result = resp.json()
                reply_text = result['candidates'][0]['content']['parts'][0]['text']
                print(f"[Chat AI] Berhasil menggunakan {version}/models/{model_name}")
                break
            except Exception as e:
                last_error = e
                print(f"[Chat AI] Gagal {version}/{model_name}: {str(e)[:100]}")
                continue
        
        if not reply_text:
            error_msg = str(last_error)
            if "403" in error_msg or "401" in error_msg:
                raise Exception("API key tidak valid atau tidak memiliki akses. Periksa https://aistudio.google.com/apikey")
            elif "404" in error_msg:
                raise Exception("Model tidak tersedia untuk API key ini. Coba buat API key baru di Google AI Studio")
            raise last_error or Exception("Semua endpoint Gemini gagal")

        return jsonify({
            "reply": reply_text,
            "timestamp": datetime.now().isoformat()
        }), 200

    except Exception as e:
        print(f"[Chat AI Error]: {e}")
        return jsonify({
            "reply": "Maaf, terjadi kesalahan saat menghubungi AI. Pastikan API key valid dan model tersedia.",
            "error": str(e)
        }), 500
        return jsonify({
            "reply": "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
            "error": str(e)
        }), 500
        


# --- API UPDATE FEEDBACK STATUS (Admin) ---
@app.route('/api/admin/feedbacks/<int:feedback_id>/status', methods=['PUT'])
def update_feedback_status(feedback_id):
    """
    API untuk admin update status feedback
    Body: {admin_id, status, admin_notes (optional), priority (optional)}
    Returns: {success, message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        admin_id = data.get('admin_id')
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', None)
        priority = data.get('priority', None)
        
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403
        
        if not new_status:
            return jsonify({"error": "Status diperlukan"}), 400
        
        valid_statuses = ['pending', 'in_review', 'resolved', 'rejected']
        if new_status not in valid_statuses:
            return jsonify({"error": f"Status tidak valid. Pilihan: {', '.join(valid_statuses)}"}), 400
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor()
        
        # Build update query
        update_parts = ["status = %s", "updated_at = NOW()"]
        params = [new_status]
        
        if new_status in ['resolved', 'rejected']:
            update_parts.append("resolved_at = NOW()")
            update_parts.append("resolved_by = %s")
            params.append(admin_id)
        
        if admin_notes:
            update_parts.append("admin_notes = %s")
            params.append(admin_notes)
        
        if priority:
            valid_priorities = ['low', 'medium', 'high', 'critical']
            if priority in valid_priorities:
                update_parts.append("priority = %s")
                params.append(priority)
        
        params.append(feedback_id)
        
        query = f"""
            UPDATE Feedback
            SET {', '.join(update_parts)}
            WHERE feedback_id = %s
        """
        
        cursor.execute(query, params)
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Feedback tidak ditemukan"}), 404
        
        return jsonify({
            "success": True,
            "message": f"Feedback status berhasil diupdate menjadi '{new_status}'",
            "feedback_id": feedback_id
        }), 200
        
    except Exception as e:
        print(f"[Update Status] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API ADD FEEDBACK RESPONSE (Admin) ---
@app.route('/api/admin/feedbacks/<int:feedback_id>/response', methods=['POST'])
def add_feedback_response(feedback_id):
    """
    API untuk admin menambahkan response/notes ke feedback
    Body: {admin_id, response_text, is_internal (boolean)}
    Returns: {response_id, message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        admin_id = data.get('admin_id')
        response_text = data.get('response_text')
        is_internal = data.get('is_internal', False)
        
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Superadmin access required"}), 403
        
        if not response_text:
            return jsonify({"error": "Response text diperlukan"}), 400
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor()
        
        # Check if feedback exists
        cursor.execute("SELECT feedback_id FROM Feedback WHERE feedback_id = %s", (feedback_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Feedback tidak ditemukan"}), 404
        
        # Insert response
        query = """
            INSERT INTO FeedbackResponse (feedback_id, admin_id, response_text, is_internal)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (feedback_id, admin_id, response_text, 1 if is_internal else 0))
        conn.commit()
        response_id = cursor.lastrowid
        
        return jsonify({
            "success": True,
            "message": "Response berhasil ditambahkan",
            "response_id": response_id
        }), 201
        
    except Exception as e:
        print(f"[Add Response] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET PUBLIC FEEDBACKS (untuk display di halaman feedback) ---
@app.route('/api/feedback/public', methods=['GET'])
def get_public_feedbacks():
    """
    API untuk mendapatkan feedback publik yang sudah resolved (untuk display di halaman feedback)
    Query params: ?limit=10&sort=date_desc
    Returns: List of public feedbacks
    """
    conn = None
    cursor = None
    
    try:
        limit = int(request.args.get('limit', 10))
        sort_by = request.args.get('sort', 'date_desc')
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Sort order
        if sort_by == 'date_desc':
            order_sql = "ORDER BY created_at DESC"
        elif sort_by == 'date_asc':
            order_sql = "ORDER BY created_at ASC"
        elif sort_by == 'rating_desc':
            order_sql = "ORDER BY rating DESC, created_at DESC"
        else:
            order_sql = "ORDER BY created_at DESC"
        
        # Query feedbacks yang resolved atau rating tinggi (untuk display publik)
        query = f"""
            SELECT 
                feedback_id, nama, rating, category, message, created_at
            FROM Feedback
            WHERE rating >= 4
            {order_sql}
            LIMIT %s
        """
        
        cursor.execute(query, (limit,))
        feedbacks = cursor.fetchall()
        
        result = []
        for fb in feedbacks:
            fb_data: dict = fb  # type: ignore
            result.append({
                "feedback_id": fb_data['feedback_id'],
                "nama": fb_data['nama'],
                "rating": fb_data['rating'],
                "category": fb_data['category'],
                "message": fb_data['message'],
                "created_at": fb_data['created_at'].isoformat() if fb_data['created_at'] else None
            })
        
        return jsonify({
            "total": len(result),
            "feedbacks": result
        }), 200
        
    except Exception as e:
        print(f"[Public Feedbacks] Error: {e}")
        # Return empty array instead of error (graceful degradation)
        return jsonify({
            "total": 0,
            "feedbacks": [],
            "error": str(e)
        }), 200
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API GET USER ROLE (for navbar sync) ---
@app.route('/api/user/role', methods=['GET'])
def get_user_role():
    """
    API untuk mendapatkan role user berdasarkan email
    Query params: ?email=user@example.com
    Returns: {email, role}
    """
    conn = None
    cursor = None
    
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email parameter required"}), 400
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT email, role FROM User WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_data: dict = user  # type: ignore
        return jsonify({
            "email": user_data['email'],
            "role": user_data['role']
        }), 200
        
    except Exception as e:
        print(f"[Get User Role] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ===================================================================
# ADMIN USER MANAGEMENT API
# ===================================================================

@app.route('/api/admin/users/stats', methods=['GET'])
def get_users_stats():
    """
    API untuk mendapatkan statistik user
    Returns: {total, active, by_role}
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Total users
        cursor.execute("SELECT COUNT(*) as total FROM User")
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore
        
        # Active users (status_akun = 'aktif')
        cursor.execute("SELECT COUNT(*) as active FROM User WHERE status_akun = 'aktif'")
        active_result = cursor.fetchone()
        active: int = active_result['active'] if active_result else 0  # type: ignore
        
        # By role
        cursor.execute("SELECT role, COUNT(*) as count FROM User GROUP BY role")
        by_role = {row['role']: row['count'] for row in cursor.fetchall()}  # type: ignore
        
        return jsonify({
            "total": total,
            "active": active,
            "by_role": by_role
        }), 200
        
    except Exception as e:
        print(f"[Users Stats] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """
    API untuk mendapatkan semua user dengan pagination dan filter
    Query params: ?page=1&limit=20&search=keyword&role=user&status=aktif
    Returns: {total, page, limit, users[]}
    """
    conn = None
    cursor = None
    
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', None)
        status_filter = request.args.get('status', None)
        
        offset = (page - 1) * limit
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Build query with filters
        where_clauses = []
        params = []
        
        if search:
            where_clauses.append("(nama LIKE %s OR email LIKE %s OR username LIKE %s)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])
        
        if role_filter:
            where_clauses.append("role = %s")
            params.append(role_filter)
        
        if status_filter:
            where_clauses.append("status_akun = %s")
            params.append(status_filter)
        
        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM User {where_sql}"
        cursor.execute(count_query, params)
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore
        
        # Get users
        query = f"""
            SELECT 
                user_id, nama, email, username, phone, role, status_akun, 
                tanggal_daftar as created_at
            FROM User
            {where_sql}
            ORDER BY tanggal_daftar DESC
            LIMIT %s OFFSET %s
        """
        
        cursor.execute(query, params + [limit, offset])
        users = cursor.fetchall()
        
        # Format response
        result = []
        for user in users:
            user_data: dict = user  # type: ignore
            result.append({
                "user_id": user_data['user_id'],
                "nama": user_data['nama'],
                "email": user_data['email'],
                "username": user_data['username'],
                "phone": user_data['phone'],
                "role": user_data['role'],
                "status": user_data['status_akun'],
                "created_at": user_data['created_at'].isoformat() if user_data['created_at'] else None
            })
        
        return jsonify({
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
            "users": result
        }), 200
        
    except Exception as e:
        print(f"[Get Users] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/admin/users', methods=['POST'])
def create_user_by_admin():
    """API untuk admin membuat user baru"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        nama = data.get('nama', '').strip()
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        phone = data.get('phone', None)
        role = data.get('role', 'user')
        status_akun = data.get('status', 'aktif')

        if not nama or not email or not username or not password:
            return jsonify({"error": "Nama, email, username, dan password wajib diisi"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        # Check existing email / username
        cursor.execute("SELECT user_id FROM User WHERE email = %s OR username = %s", (email, username))
        if cursor.fetchone():
            return jsonify({"error": "Email atau username sudah terdaftar"}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        query = """
            INSERT INTO User (nama, email, username, phone, password, role, status_akun, accept_terms)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        """
        cursor.execute(query, (nama, email, username, phone, hashed_password, role, status_akun))
        conn.commit()

        new_id = cursor.lastrowid
        return jsonify({"message": "User berhasil dibuat", "user_id": new_id}), 201

    except Exception as e:
        print(f"[Create User Admin] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/admin/users/<int:target_id>', methods=['PUT'])
def update_user_by_admin(target_id):
    """API untuk admin mengubah data user"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        nama = data.get('nama', '').strip()
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        phone = data.get('phone', None)
        role = data.get('role', 'user')
        status_akun = data.get('status', 'aktif')

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT user_id FROM User WHERE user_id = %s", (target_id,))
        if not cursor.fetchone():
            return jsonify({"error": "User tidak ditemukan"}), 404

        query = """
            UPDATE User
            SET nama = %s, email = %s, username = %s, phone = %s, role = %s, status_akun = %s
            WHERE user_id = %s
        """
        cursor.execute(query, (nama, email, username, phone, role, status_akun, target_id))
        conn.commit()

        return jsonify({"message": "Data user berhasil diperbarui"}), 200

    except Exception as e:
        print(f"[Update User Admin] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/admin/users/<int:target_id>', methods=['DELETE'])
def delete_user_by_admin(target_id):
    """API untuk admin menghapus user"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT user_id, role FROM User WHERE user_id = %s", (target_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User tidak ditemukan"}), 404

        cursor.execute("DELETE FROM User WHERE user_id = %s", (target_id,))
        conn.commit()

        return jsonify({"message": "User berhasil dihapus"}), 200

    except Exception as e:
        print(f"[Delete User Admin] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()



@app.route('/api/admin/detections/stats', methods=['GET'])
def get_detections_stats():
    """
    API untuk mendapatkan statistik deteksi
    Primary: DetectionHistory, fallback ke Diagnosa (legacy) jika tabel belum ada
    Returns: {total, by_disease, recent_count}
    """
    conn = None
    cursor = None
    
    def _query_count(table: str, where_clause: str = "") -> int:
        try:
            q = f"SELECT COUNT(*) as cnt FROM {table} {where_clause}"
            cursor.execute(q)
            r = cursor.fetchone()
            return int(r['cnt']) if r and 'cnt' in r else 0  # type: ignore
        except Exception as ex:
            # Tabel tidak ada atau kolom berbeda -> 0
            if "doesn't exist" in str(ex) or "Unknown column" in str(ex):
                return -1
            raise

    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Primary: DetectionHistory
        total = _query_count("DetectionHistory")
        recent = _query_count("DetectionHistory", "WHERE detection_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
        by_disease = {}
        try:
            if total != -1:
                cursor.execute("SELECT disease_name, COUNT(*) as cnt FROM DetectionHistory GROUP BY disease_name")
                by_disease = {row['disease_name']: row['cnt'] for row in cursor.fetchall()}  # type: ignore
        except Exception:
            by_disease = {}

        # Fallback ke Diagnosa jika DetectionHistory belum ada / kosong dan Diagnosa ada
        if total == -1:
            total = _query_count("Diagnosa")
            recent = _query_count("Diagnosa", "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
            if total == -1:
                total = 0
            if recent == -1:
                recent = 0
        else:
            # Jika DetectionHistory ada, tambahkan count legacy Diagnosa sebagai info tambahan (tidak double hitung primary)
            legacy_total = _query_count("Diagnosa")
            if legacy_total > 0:
                # Simpan sebagai field terpisah agar tidak membingungkan
                by_disease["_legacy_Diagnosa"] = legacy_total

        if total == -1:
            total = 0
        if recent == -1:
            recent = 0

        return jsonify({
            "total": total,
            "recent_count": recent,
            "by_disease": by_disease
        }), 200
        
    except Exception as e:
        print(f"[Detections Stats] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ===================================================================
# NEWS API (Berita/Artikel)
# ===================================================================

@app.route('/api/admin/news/stats', methods=['GET'])
def get_news_stats():
    """
    API untuk mendapatkan statistik berita
    Returns: {total, published, draft, by_category}
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Total news
        cursor.execute("SELECT COUNT(*) as total FROM News")
        total_result = cursor.fetchone()
        total: int = total_result['total'] if total_result else 0  # type: ignore
        
        # Published news
        cursor.execute("SELECT COUNT(*) as published FROM News WHERE is_published = 1")
        published_result = cursor.fetchone()
        published: int = published_result['published'] if published_result else 0  # type: ignore
        
        # Draft news
        cursor.execute("SELECT COUNT(*) as draft FROM News WHERE is_published = 0")
        draft_result = cursor.fetchone()
        draft: int = draft_result['draft'] if draft_result else 0  # type: ignore
        
        # By category
        cursor.execute("SELECT category, COUNT(*) as count FROM News GROUP BY category")
        by_category = {row['category']: row['count'] for row in cursor.fetchall()}  # type: ignore
        
        return jsonify({
            "total": total,
            "published": published,
            "draft": draft,
            "by_category": by_category
        }), 200
        
    except Exception as e:
        print(f"[News Stats] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/news', methods=['GET'])
def get_all_news():
    """
    API untuk mendapatkan semua berita dengan filter
    Query params: ?category=teknologi&limit=20&published_only=true
    Returns: {total, news[]}
    """
    conn = None
    cursor = None
    
    try:
        category = request.args.get('category')  # teknologi, budidaya, pasar, penelitian
        limit = int(request.args.get('limit', 20))
        published_only = request.args.get('published_only', 'true').lower() == 'true'
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Build query
        query = "SELECT * FROM News WHERE 1=1"
        params = []
        
        if published_only:
            query += " AND is_published = 1"
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        news_list = cursor.fetchall()
        
        result = []
        for news in news_list:
            news_data: dict = news  # type: ignore
            result.append({
                "news_id": news_data['news_id'],
                "title": news_data['title'],
                "excerpt": news_data['excerpt'],
                "content": news_data['content'],
                "category": news_data['category'],
                "image_url": news_data['image_url'],
                "external_url": news_data['external_url'],
                "author": news_data['author'],
                "read_time": news_data['read_time'],
                "is_published": news_data['is_published'],
                "created_by": news_data['created_by'],
                "created_at": news_data['created_at'].isoformat() if news_data['created_at'] else None,
                "updated_at": news_data['updated_at'].isoformat() if news_data['updated_at'] else None
            })
        
        return jsonify({
            "total": len(result),
            "news": result
        }), 200
        
    except Exception as e:
        print(f"[Get News] Error: {e}")
        return jsonify({
            "total": 0,
            "news": [],
            "error": str(e)
        }), 200
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/news/<int:news_id>', methods=['GET'])
def get_news_detail(news_id):
    """
    API untuk mendapatkan detail berita berdasarkan ID
    Returns: Single news object
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM News WHERE news_id = %s", (news_id,))
        news = cursor.fetchone()
        
        if not news:
            return jsonify({"error": "Berita tidak ditemukan"}), 404
        
        news_data: dict = news  # type: ignore
        return jsonify({
            "news_id": news_data['news_id'],
            "title": news_data['title'],
            "excerpt": news_data['excerpt'],
            "content": news_data['content'],
            "category": news_data['category'],
            "image_url": news_data['image_url'],
            "external_url": news_data['external_url'],
            "author": news_data['author'],
            "read_time": news_data['read_time'],
            "is_published": news_data['is_published'],
            "created_by": news_data['created_by'],
            "created_at": news_data['created_at'].isoformat() if news_data['created_at'] else None,
            "updated_at": news_data['updated_at'].isoformat() if news_data['updated_at'] else None
        }), 200
        
    except Exception as e:
        print(f"[Get News Detail] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/news', methods=['POST'])
def create_news():
    """
    API untuk membuat berita baru (admin only)
    Body: {title, excerpt, content, category, image_url, external_url, author, read_time, created_by (admin user_id)}
    Returns: {news_id, message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        # Validate required fields
        required_fields = ['title', 'content', 'category', 'created_by']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} diperlukan"}), 400
        
        created_by = data.get('created_by')
        if not verify_superadmin(created_by):
            return jsonify({"error": "Unauthorized. Hanya superadmin yang dapat membuat berita"}), 403
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor()
        
        query = """
            INSERT INTO News (title, excerpt, content, category, image_url, external_url, 
                            author, read_time, is_published, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data['title'],
            data.get('excerpt', ''),
            data['content'],
            data['category'],
            data.get('image_url', ''),
            data.get('external_url', ''),
            data.get('author', 'Admin'),
            data.get('read_time', '5 menit'),
            data.get('is_published', 1),
            created_by
        )
        
        cursor.execute(query, values)
        conn.commit()
        news_id = cursor.lastrowid
        
        return jsonify({
            "success": True,
            "message": "Berita berhasil dibuat",
            "news_id": news_id
        }), 201
        
    except Exception as e:
        print(f"[Create News] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    """
    API untuk update berita (admin only)
    Body: {title?, excerpt?, content?, category?, image_url?, external_url?, author?, read_time?, is_published?, admin_id}
    Returns: {message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        admin_id = data.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Hanya superadmin yang dapat update berita"}), 403
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor()
        
        # Check if news exists
        cursor.execute("SELECT news_id FROM News WHERE news_id = %s", (news_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Berita tidak ditemukan"}), 404
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        updatable_fields = ['title', 'excerpt', 'content', 'category', 'image_url', 
                          'external_url', 'author', 'read_time', 'is_published']
        
        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            return jsonify({"error": "Tidak ada field yang diupdate"}), 400
        
        values.append(news_id)
        query = f"UPDATE News SET {', '.join(update_fields)} WHERE news_id = %s"
        
        cursor.execute(query, values)
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Berita berhasil diupdate"
        }), 200
        
    except Exception as e:
        print(f"[Update News] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    """
    API untuk delete berita (admin only)
    Body: {admin_id}
    Returns: {message}
    """
    conn = None
    cursor = None
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
        
        admin_id = data.get('admin_id')
        if not admin_id or not verify_superadmin(admin_id):
            return jsonify({"error": "Unauthorized. Hanya superadmin yang dapat delete berita"}), 403
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        
        cursor = conn.cursor()
        
        # Check if news exists
        cursor.execute("SELECT news_id FROM News WHERE news_id = %s", (news_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Berita tidak ditemukan"}), 404
        
        cursor.execute("DELETE FROM News WHERE news_id = %s", (news_id,))
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Berita berhasil dihapus"
        }), 200
        
    except Exception as e:
        print(f"[Delete News] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- Chat AI menggunakan Google Gemini REST API ---


# --- Health Check Endpoint (untuk deployment platforms) ---
@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint untuk monitoring deployment"""
    try:
        # Test database connection
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = "connected"
        else:
            db_status = "disconnected"
    except:
        db_status = "error"
    
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "model_loaded": MODEL is not None,
        "timestamp": datetime.now().isoformat()
    }), 200


# --- Admin: Global Detection Audit ---

@app.route('/api/admin/detections', methods=['GET'])
def get_admin_all_detections():
    """
    API untuk Superadmin: Mengambil SEMUA riwayat deteksi dari seluruh pengguna.
    Dilengkapi JOIN ke tabel User untuk mendapatkan nama & email pengunggah.
    Mendukung filter: severity, disease, search (nama/email/penyakit), page, limit.
    Returns: { detections: [...], total, page, total_pages, stats }
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        # Query params
        severity_filter = request.args.get('severity', '').strip().lower()
        disease_filter = request.args.get('disease', '').strip()
        search_query = request.args.get('search', '').strip()
        page = max(1, int(request.args.get('page', 1)))
        limit = min(50, max(1, int(request.args.get('limit', 20))))
        offset = (page - 1) * limit

        # Build WHERE clauses
        conditions = []
        params = []

        if severity_filter and severity_filter != 'all':
            conditions.append("dh.severity = %s")
            params.append(severity_filter)

        if disease_filter and disease_filter.lower() != 'all':
            conditions.append("dh.disease_name = %s")
            params.append(disease_filter)

        if search_query:
            conditions.append("(u.nama LIKE %s OR u.email LIKE %s OR dh.disease_name LIKE %s)")
            like_val = f"%{search_query}%"
            params.extend([like_val, like_val, like_val])

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        # Count total
        count_q = f"""
            SELECT COUNT(*) as total
            FROM DetectionHistory dh
            LEFT JOIN User u ON dh.user_id = u.user_id
            {where_clause}
        """
        cursor.execute(count_q, params)
        count_row = cursor.fetchone()
        total = count_row['total'] if count_row else 0  # type: ignore
        total_pages = max(1, (total + limit - 1) // limit)

        # Main query with JOIN
        main_q = f"""
            SELECT
                dh.id,
                dh.user_id,
                u.nama AS user_nama,
                u.email AS user_email,
                dh.image_path,
                dh.disease_name,
                dh.confidence,
                dh.severity,
                dh.description,
                dh.symptoms,
                dh.treatment,
                dh.prevention,
                dh.detection_date
            FROM DetectionHistory dh
            LEFT JOIN User u ON dh.user_id = u.user_id
            {where_clause}
            ORDER BY dh.detection_date DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(main_q, params + [limit, offset])
        rows = cursor.fetchall()

        detections = []
        for row in rows:  # type: ignore
            detections.append({
                "id": row['id'],
                "user_id": row['user_id'],
                "user_nama": row['user_nama'] or "Pengguna Tidak Dikenal",
                "user_email": row['user_email'] or "-",
                "image_url": f"/api/uploads/{row['image_path']}",
                "disease_name": row['disease_name'],
                "confidence": float(row['confidence'] or 0),
                "severity": row['severity'],
                "description": row['description'] or "",
                "symptoms": json.loads(row['symptoms']) if isinstance(row.get('symptoms'), str) and row['symptoms'] else (row.get('symptoms') or []),
                "treatment": json.loads(row['treatment']) if isinstance(row.get('treatment'), str) and row['treatment'] else (row.get('treatment') or []),
                "prevention": json.loads(row['prevention']) if isinstance(row.get('prevention'), str) and row['prevention'] else (row.get('prevention') or []),
                "detection_date": row['detection_date'].isoformat() if row['detection_date'] else None
            })

        # Aggregate stats
        cursor.execute("SELECT COUNT(*) as total, AVG(confidence) as avg_conf FROM DetectionHistory")
        agg = cursor.fetchone()
        cursor.execute("SELECT COUNT(*) as recent FROM DetectionHistory WHERE detection_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
        recent_row = cursor.fetchone()
        cursor.execute("SELECT disease_name, COUNT(*) as cnt FROM DetectionHistory GROUP BY disease_name ORDER BY cnt DESC LIMIT 1")
        top_disease_row = cursor.fetchone()

        stats = {
            "total_all": int(agg['total']) if agg else 0,  # type: ignore
            "avg_confidence": round(float(agg['avg_conf']), 1) if agg and agg['avg_conf'] else 0,  # type: ignore
            "recent_7days": int(recent_row['recent']) if recent_row else 0,  # type: ignore
            "top_disease": top_disease_row['disease_name'] if top_disease_row else "-"  # type: ignore
        }

        return jsonify({
            "detections": detections,
            "total": total,
            "page": page,
            "total_pages": total_pages,
            "limit": limit,
            "stats": stats
        }), 200

    except Exception as e:
        print(f"[admin/detections] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.route('/api/admin/activities', methods=['GET'])
def get_admin_activities():
    """
    API untuk Superadmin: Mengambil log aktivitas terbaru secara dinamis.
    Menggabungkan: deteksi terbaru + pendaftaran user terbaru.
    Returns: { activities: [{ type, description, user_nama, timestamp }] }
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)

        activities = []

        # 5 Deteksi terbaru
        cursor.execute("""
            SELECT
                dh.disease_name, dh.confidence, dh.severity, dh.detection_date,
                u.nama AS user_nama, u.email AS user_email
            FROM DetectionHistory dh
            LEFT JOIN User u ON dh.user_id = u.user_id
            ORDER BY dh.detection_date DESC
            LIMIT 5
        """)
        detections = cursor.fetchall()
        for d in detections:  # type: ignore
            activities.append({
                "type": "detection",
                "description": f"Mendeteksi {d['disease_name']} ({d['confidence']:.1f}%) - Severity: {d['severity']}",
                "user_nama": d['user_nama'] or "Pengguna",
                "user_email": d['user_email'] or "-",
                "timestamp": d['detection_date'].isoformat() if d['detection_date'] else None
            })

        # 5 Pendaftaran user terbaru
        cursor.execute("""
            SELECT nama, email, tanggal_daftar, role
            FROM User
            ORDER BY tanggal_daftar DESC
            LIMIT 5
        """)
        users = cursor.fetchall()
        for u in users:  # type: ignore
            activities.append({
                "type": "new_user",
                "description": f"Akun baru terdaftar sebagai {u['role']}",
                "user_nama": u['nama'] or "Pengguna Baru",
                "user_email": u['email'] or "-",
                "timestamp": u['tanggal_daftar'].isoformat() if u['tanggal_daftar'] else None
            })

        # Sort gabungan berdasarkan waktu terbaru
        activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        activities = activities[:8]  # Ambil 8 terbaru

        return jsonify({"activities": activities}), 200

    except Exception as e:
        print(f"[admin/activities] Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()



if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # host='0.0.0.0' allows access from other devices on the same network
    app.run(debug=True, host='0.0.0.0', port=port)