"""Endpoint autentikasi dan pemulihan akun."""
from datetime import datetime, timedelta
import hashlib
import secrets

import bcrypt
import mysql.connector
from flask import Blueprint, current_app, jsonify, redirect, request

from plantvision.services import (
    DB_NAME, FRONTEND_URL, GOOGLE_AUTH_URL, GOOGLE_OAUTH_CLIENT_ID,
    MOCK_DB_AVAILABLE, OAUTH_REDIRECT_URI, USE_MOCK_DB, OAuthServiceError,
    create_session_token, generate_unique_username, get_db_connection,
    get_google_profile, mock_db, send_reset_email, verify_session_token,
)

bp = Blueprint('auth', __name__)

@bp.route('/auth/google')
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


@bp.route('/auth/google/callback')
def google_oauth_callback():
    """Terima code dari Google, tukar jadi info user, reconcile ke tabel User, redirect ke frontend."""
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return jsonify({"error": "Login Google dibatalkan atau ditolak"}), 400
    if not code:
        return jsonify({"error": "Kode otorisasi tidak ada"}), 400

    # Pertukaran token dan pengambilan profil berada di service OAuth.
    try:
        ginfo = get_google_profile(code)
    except OAuthServiceError as exc:
        return jsonify({"error": str(exc)}), 400
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
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@bp.route('/api/auth/session', methods=['POST'])
def auth_session():
    """Verifikasi token sesi OAuth; terbitkan server session untuk disimpan di localStorage frontend."""
    data = request.get_json(silent=True) or {}
    token = data.get('token') or request.args.get('token')
    if not token:
        return jsonify({"error": "Token tidak ada"}), 400
    payload = verify_session_token(token)
    if not payload:
        return jsonify({"error": "Token tidak valid atau kadaluarsa"}), 401
    # Issue a proper server-side session for this OAuth user
    return current_app.extensions['security'].login_response(payload)


# --- API REGISTRASI (F-02) ---
@bp.route('/api/register', methods=['POST'])
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
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        # 6. Pastikan koneksi dan kursor ditutup
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


# --- API LOGIN (F-01) ---
@bp.route('/api/login', methods=['POST'])
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
                return current_app.extensions['security'].login_response(user)
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
                # Password cocok! Terbitkan server session via Security.
                return current_app.extensions['security'].login_response(user_data)
            else:
                return jsonify({"error": "Username atau password salah"}), 401
        except Exception as e:
            print(f"Error detail saat verifikasi password: {str(e)}")
            return jsonify({"error": "Terjadi kesalahan internal"}), 500

    except Exception as e:
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        # 6. Pastikan koneksi dan kursor ditutup
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()



# --- API SET PASSWORD (untuk user Google) ---
@bp.route('/api/set-password', methods=['POST'])
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
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API LUPA KATA SANDI (Lupa Kata Sandi) ---
@bp.route('/api/forgot-password', methods=['POST'])
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
                link = f"{FRONTEND_URL}/reset-password?token={token}"
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

        link = f"{FRONTEND_URL}/reset-password?token={token}"
        sent = send_reset_email(email, link)
        return jsonify({
            "message": "Jika email terdaftar, tautan reset telah dikirim.",
            "dev_reset_link": link if not sent else None
        }), 200

    except Exception as e:
        print(f"[ForgotPassword] Error: {e}")
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API VERIFIKASI TOKEN RESET PASSWORD ---
@bp.route('/api/reset-password/verify', methods=['GET'])
def verify_reset_token():
    """
    Cek apakah token reset masih valid dan belum kedaluwarsa.
    Query param: ?token=xxx
    """
    token = (request.args.get('token') or '').strip()
    if not token:
        return jsonify({"valid": False, "error": "Token tidak ditemukan"}), 400

    # [FALLBACK] mock db
    if USE_MOCK_DB and MOCK_DB_AVAILABLE:
        for user in mock_db.users.values():
            if user.get('reset_token') == token:
                expiry = user.get('reset_token_expiry')
                if expiry and datetime.now() > expiry:
                    return jsonify({"valid": False, "error": "Token reset sudah kedaluwarsa (berlaku 15 menit). Silakan minta tautan baru."}), 400
                return jsonify({"valid": True, "email": user.get('email')}), 200
        return jsonify({"valid": False, "error": "Token reset tidak valid atau sudah pernah digunakan."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Koneksi database gagal"}), 500
        cursor = conn.cursor(dictionary=True)
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        cursor.execute(
            "SELECT email, reset_token_expiry FROM User WHERE reset_token=%s LIMIT 1",
            (token_hash,)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({"valid": False, "error": "Token reset tidak valid atau sudah pernah digunakan."}), 400

        expiry = user.get('reset_token_expiry')
        if not expiry or datetime.now() > expiry:
            return jsonify({"valid": False, "error": "Token reset sudah kedaluwarsa (berlaku 15 menit). Silakan minta tautan baru."}), 400

        return jsonify({"valid": True, "email": user.get('email')}), 200
    except Exception as e:
        print(f"[Verify Reset Token] Error: {e}")
        return jsonify({"valid": False, "error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# --- API RESET PASSWORD (verifikasi token & simpan kata sandi baru) ---
@bp.route('/api/reset-password', methods=['POST'])
def reset_password():
    """
    Verifikasi token reset lalu set password baru.
    Input JSON: { token, new_password }
    """
    conn = None
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        token = (data.get('token') or '').strip()
        new_password = data.get('new_password') or ''

        if not token:
            return jsonify({"error": "Token reset wajib disertakan"}), 400
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
            return jsonify({"error": "Token reset tidak valid atau sudah pernah digunakan."}), 400

        expiry = user.get('reset_token_expiry')
        if not expiry or datetime.now() > expiry:
            return jsonify({"error": "Token reset sudah kedaluwarsa (berlaku 15 menit). Silakan minta tautan baru."}), 400

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            "UPDATE User SET password=%s, reset_token=NULL, reset_token_expiry=NULL, provider='local' WHERE user_id=%s",
            (hashed_password, user['user_id'])
        )
        conn.commit()
        return jsonify({"message": "Kata sandi berhasil direset. Silakan masuk dengan kata sandi baru Anda."}), 200

    except Exception as e:
        return jsonify({"error": "Terjadi kesalahan internal"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
