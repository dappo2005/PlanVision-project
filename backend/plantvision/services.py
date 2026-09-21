"""Layanan bersama untuk route PlantVision.

Modul ini sengaja tidak membuat objek Flask. ``application.create_app`` memasang
konfigurasi lebih dulu, kemudian route memakai layanan di sini.
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import smtplib
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import bcrypt
import mysql.connector
import numpy as np
import requests
from flask import current_app
from PIL import Image, ImageOps, UnidentifiedImageError
from tensorflow.keras.models import load_model as keras_load_model

from disease_info import get_disease_info

try:
    from mock_db import mock_db
    MOCK_DB_AVAILABLE = True
except ImportError:
    mock_db = None
    MOCK_DB_AVAILABLE = False


ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_IMAGE_MIMES = {'image/jpeg', 'image/png', 'image/webp'}
ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'WEBP'}
MAX_IMAGE_PIXELS = 20_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

CLASS_NAMES = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']
IMAGE_SIZE = 256
MODEL = None
MODEL_TYPE = None

# Nilai berikut diisi satu kali oleh configure() saat aplikasi dibuat.
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_USER = 'root'
DB_PASSWORD = ''
DB_NAME = 'plantvision_db'
USE_MOCK_DB = False
GEMINI_API_KEY = ''
GOOGLE_OAUTH_CLIENT_ID = ''
GOOGLE_OAUTH_CLIENT_SECRET = ''
OAUTH_REDIRECT_URI = 'http://localhost:5000/auth/google/callback'
FRONTEND_URL = 'http://localhost:3000'
GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
SMTP_HOST = 'smtp.gmail.com'
SMTP_PORT = 587
SMTP_USER = ''
SMTP_PASSWORD = ''
SMTP_FROM_NAME = 'PlantVision'
MODEL_FILENAME = 'citrus_mobilenetv2_finetuned.h5'
MODEL_PATH = ''


class UploadValidationError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def configure(config):
    """Salin konfigurasi tervalidasi dan muat model sekali saat startup."""
    global DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, USE_MOCK_DB
    global GEMINI_API_KEY, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
    global OAUTH_REDIRECT_URI, FRONTEND_URL, SMTP_HOST, SMTP_PORT
    global SMTP_USER, SMTP_PASSWORD, SMTP_FROM_NAME, MODEL_FILENAME, MODEL_PATH

    DB_HOST = config['DB_HOST']
    DB_PORT = config['DB_PORT']
    DB_USER = config['DB_USER']
    DB_PASSWORD = config['DB_PASSWORD']
    DB_NAME = config['DB_NAME']
    USE_MOCK_DB = config['USE_MOCK_DB']
    GEMINI_API_KEY = config['GEMINI_API_KEY']
    GOOGLE_OAUTH_CLIENT_ID = config['GOOGLE_OAUTH_CLIENT_ID']
    GOOGLE_OAUTH_CLIENT_SECRET = config['GOOGLE_OAUTH_CLIENT_SECRET']
    OAUTH_REDIRECT_URI = config['OAUTH_REDIRECT_URI']
    FRONTEND_URL = config['FRONTEND_URL']
    SMTP_HOST = config['SMTP_HOST']
    SMTP_PORT = config['SMTP_PORT']
    SMTP_USER = config['SMTP_USER']
    SMTP_PASSWORD = config['SMTP_PASSWORD']
    SMTP_FROM_NAME = config['SMTP_FROM_NAME']
    MODEL_FILENAME = config['MODEL_FILENAME']
    MODEL_PATH = resolve_model_path(MODEL_FILENAME)

    print(f"[Backend] Connecting to MySQL DB='{DB_NAME}' on {DB_HOST}:{DB_PORT} as {DB_USER}")
    if USE_MOCK_DB and MOCK_DB_AVAILABLE:
        print('[Database] MOCK DATABASE MODE ENABLED - Using in-memory mock database')
    else:
        print('[Database] Using real MySQL database')

    if config['SKIP_MODEL_LOAD']:
        print('[Model] SKIP_MODEL_LOAD=1, melewati load model saat startup')
    else:
        load_model_at_startup()

    if GEMINI_API_KEY:
        print('[Gemini] API key berhasil dikonfigurasi')
    else:
        print('[Gemini] Peringatan: GEMINI_API_KEY tidak ditemukan di environment/.env')


def resolve_model_path(filename):
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
    requested = os.path.join(model_dir, filename)
    if os.path.exists(requested):
        return requested
    for alternative in ('citrus_mobilenetv2_finetuned.h5', 'citrus_efficientnet_finetuned.h5'):
        candidate = os.path.join(model_dir, alternative)
        if os.path.exists(candidate):
            return candidate
    return requested


def detect_model_type(model):
    """Kenali preprocessing model dari nama layer-nya."""
    try:
        names = ' '.join(layer.name.lower() for layer in model.layers)
        if 'mobilenetv2' in names or 'mobilenet' in names:
            return 'mobilenetv2'
        if 'efficientnet' in names:
            return 'efficientnet'
    except Exception:
        pass
    return 'cnn'


def load_model_at_startup():
    global MODEL, MODEL_TYPE
    try:
        if os.path.exists(MODEL_PATH):
            print(f'Loading model from {MODEL_PATH}')
            MODEL = keras_load_model(MODEL_PATH)
            MODEL_TYPE = detect_model_type(MODEL)
            print(f'Model loaded successfully! Architecture: {MODEL_TYPE.upper()}')
            print(f'Model input shape: {MODEL.input_shape}')
        else:
            print(f'Warning: Model not found at {MODEL_PATH}')
    except Exception as exc:
        print(f'Error loading model: {exc}')


def predict_image(filepath):
    """Jalankan preprocessing dan inferensi tanpa mencampurnya dengan HTTP."""
    if MODEL is None:
        raise RuntimeError('Model AI belum siap')
    started_at = time.time()
    with Image.open(filepath) as source:
        image = source.convert('RGB')
        width, height = image.size
        side = min(width, height)
        left = (width - side) // 2
        top = (height - side) // 2
        cropped = image.crop((left, top, left + side, top + side))
        resized = cropped.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.LANCZOS)
        image_array = np.expand_dims(np.asarray(resized, dtype=np.float32), axis=0)
    predictions = MODEL.predict(image_array, verbose=0)[0]
    return predictions, (time.time() - started_at) * 1000


class OAuthServiceError(RuntimeError):
    """Kesalahan OAuth yang aman ditampilkan sebagai respons client."""


def get_google_profile(code):
    """Tukar authorization code menjadi profil Google terverifikasi."""
    token_response = requests.post(GOOGLE_TOKEN_URL, data={
        'code': code,
        'client_id': GOOGLE_OAUTH_CLIENT_ID,
        'client_secret': GOOGLE_OAUTH_CLIENT_SECRET,
        'redirect_uri': OAUTH_REDIRECT_URI,
        'grant_type': 'authorization_code',
    })
    if token_response.status_code != 200:
        print(f'[Google OAuth] Token exchange failed with status {token_response.status_code}')
        raise OAuthServiceError('Gagal menukar kode Google')
    access_token = token_response.json().get('access_token')
    if not access_token:
        raise OAuthServiceError('Token akses Google tidak diterima')
    profile_response = requests.get(
        GOOGLE_USERINFO_URL, headers={'Authorization': f'Bearer {access_token}'})
    if profile_response.status_code != 200:
        raise OAuthServiceError('Gagal mengambil profil Google')
    return profile_response.json()


def generate_gemini_reply(user_message):
    """Kirim pertanyaan agronomi ke endpoint Gemini dengan fallback model."""
    if not GEMINI_API_KEY:
        raise RuntimeError('Chat AI belum dikonfigurasi. Set GEMINI_API_KEY di .env')
    system_prompt = (
        'Anda adalah PlantVision AI, asisten agronomi untuk pertanian jeruk. '
        'Jawab dalam Bahasa Indonesia dengan singkat, praktis, dan sopan. '
        'Fokus pada penyakit daun jeruk: Black spot, Canker, Greening, Melanose, Healthy.'
    )
    payload = {'contents': [{'parts': [{'text': f'{system_prompt}\n\nPertanyaan: {user_message}'}]}]}
    endpoints = (
        ('v1beta', 'gemini-3.6-flash'), ('v1beta', 'gemini-3.7-flash'),
        ('v1beta', 'gemini-flash-latest'), ('v1beta', 'gemini-pro-latest'),
    )
    last_error = None
    for version, model_name in endpoints:
        try:
            url = (f'https://generativelanguage.googleapis.com/{version}/models/'
                   f'{model_name}:generateContent?key={GEMINI_API_KEY}')
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                print(f'[Chat AI] Berhasil menggunakan {version}/models/{model_name}')
                return response.json()['candidates'][0]['content']['parts'][0]['text']
            last_error = RuntimeError(f'HTTP {response.status_code}: {response.text}')
            print(f'[Chat AI] Model {version}/{model_name} status {response.status_code}')
        except Exception as exc:
            last_error = exc
            print(f'[Chat AI] Gagal {version}/{model_name}: {str(exc)[:100]}')
    error_message = str(last_error)
    if '403' in error_message or '401' in error_message:
        raise RuntimeError('API key tidak valid atau tidak memiliki akses. Periksa https://aistudio.google.com/apikey')
    if '404' in error_message:
        raise RuntimeError('Model tidak tersedia untuk API key ini. Coba buat API key baru di Google AI Studio')
    raise last_error or RuntimeError('Semua endpoint Gemini gagal')


def get_db_connection():
    """Buat koneksi MySQL baru untuk satu operasi request."""
    try:
        return mysql.connector.connect(
            host=DB_HOST, port=DB_PORT, user=DB_USER,
            password=DB_PASSWORD, database=DB_NAME,
        )
    except mysql.connector.Error as exc:
        print(f'Error connecting to MySQL: {exc}')
        return None


def save_validated_image(file_storage):
    """Validasi isi gambar lalu simpan ulang sebagai JPEG tanpa metadata."""
    extension = os.path.splitext(file_storage.filename or '')[1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise UploadValidationError('Format file harus JPG, PNG, atau WebP', 415)
    if (file_storage.mimetype or '').lower() not in ALLOWED_IMAGE_MIMES:
        raise UploadValidationError('Tipe konten gambar tidak didukung', 415)
    try:
        file_storage.stream.seek(0)
        with Image.open(file_storage.stream) as probe:
            detected_format = (probe.format or '').upper()
            width, height = probe.size
            probe.verify()
        if detected_format not in ALLOWED_IMAGE_FORMATS:
            raise UploadValidationError('Isi file bukan gambar yang didukung', 415)
        if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
            raise UploadValidationError('Resolusi gambar terlalu besar')
        file_storage.stream.seek(0)
        with Image.open(file_storage.stream) as source:
            clean_image = ImageOps.exif_transpose(source).convert('RGB')
            filename = f'{secrets.token_hex(20)}.jpg'
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            clean_image.save(filepath, format='JPEG', quality=92, optimize=True)
        return filename, filepath
    except UploadValidationError:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise UploadValidationError('File gambar tidak valid') from exc


def generate_unique_username(base, cursor):
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', base.lower()) or 'user'
    candidate, suffix = cleaned, 1
    while True:
        cursor.execute('SELECT 1 FROM User WHERE username=%s LIMIT 1', (candidate,))
        if cursor.fetchone() is None:
            return candidate
        candidate = f'{cleaned}{suffix}'
        suffix += 1


def send_reset_email(to_email, reset_link):
    """Kirim tautan reset melalui konfigurasi SMTP yang sudah tervalidasi."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print('[Email] SMTP_USER/SMTP_PASSWORD belum diset. Email reset TIDAK dikirim.')
        return False
    try:
        message = MIMEMultipart('alternative')
        message['Subject'] = 'PlantVision - Atur Ulang Kata Sandi Anda'
        message['From'] = f'{SMTP_FROM_NAME} <{SMTP_USER}>'
        message['To'] = to_email
        text = (
            'Halo,\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun '
            f'PlantVision Anda. Tautan ini berlaku 15 menit:\n{reset_link}\n\n'
            'Jika Anda tidak meminta ini, abaikan email ini.\n\nTim PlantVision'
        )
        html = f'''<html><body style="font-family:Arial,sans-serif;background:#f6f7f8;padding:24px;">
<div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:28px 24px;">
<h2 style="color:#2ECC71">PlantVision</h2><p>Kami menerima permintaan untuk mengatur ulang kata sandi Anda.</p>
<p><a href="{reset_link}" style="background:#2ECC71;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Atur Ulang Kata Sandi</a></p>
<p style="font-size:13px;color:#6b7280">Tautan berlaku 15 menit. Jika Anda tidak meminta ini, abaikan email ini.</p>
</div></body></html>'''
        message.attach(MIMEText(text, 'plain'))
        message.attach(MIMEText(html, 'html'))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to_email], message.as_string())
        print(f'[Email] Email reset terkirim ke {to_email}')
        return True
    except Exception as exc:
        print(f'[Email] Gagal mengirim email: {exc}')
        return False


def create_session_token(user_data):
    payload = json.dumps({
        'user_id': user_data.get('user_id'), 'nama': user_data.get('nama'),
        'email': user_data.get('email'), 'username': user_data.get('username'),
        'role': user_data.get('role'), 'exp': int(time.time()) + 3600,
    }).encode('utf-8')
    encoded = base64.urlsafe_b64encode(payload).decode('utf-8').rstrip('=')
    signature = hmac.new(current_app.secret_key.encode('utf-8'), encoded.encode('utf-8'), hashlib.sha256).hexdigest()
    return f'{encoded}.{signature}'


def verify_session_token(token):
    try:
        encoded, signature = token.rsplit('.', 1)
        expected = hmac.new(current_app.secret_key.encode('utf-8'), encoded.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        padding = '=' * (-len(encoded) % 4)
        data = json.loads(base64.urlsafe_b64decode(encoded + padding).decode('utf-8'))
        return data if int(data.get('exp', 0)) >= int(time.time()) else None
    except Exception:
        return None


def verify_superadmin(user_id):
    """Pertahankan verifikasi database lama untuk endpoint administrasi."""
    conn = cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            return False
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT role FROM User WHERE user_id = %s', (user_id,))
        user = cursor.fetchone()
        return bool(user and user['role'] == 'superadmin')
    except Exception as exc:
        print(f'[Verify Admin] Error: {exc}')
        return False
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
