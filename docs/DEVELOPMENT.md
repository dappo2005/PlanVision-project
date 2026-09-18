# Panduan Pengembangan PlantVision

Dokumen ini adalah acuan untuk menyiapkan dan menjalankan PlantVision secara
lokal. Jalankan semua perintah dari root repository, kecuali disebutkan lain.

## Prasyarat

- Node.js 18 atau lebih baru
- Python 3.11 (TensorFlow 2.15 tidak mendukung semua versi Python yang lebih baru)
- MySQL 8 untuk mode database riil

## Instalasi

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Jangan memasukkan kredensial ke source code atau dokumentasi. Simpan konfigurasi
lokal dalam `backend/.env`; file tersebut diabaikan oleh Git.

Contoh konfigurasi untuk MySQL lokal:

```dotenv
APP_ENV=development
FLASK_DEBUG=0
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ganti_dengan_password_lokal
DB_NAME=plantvision_db
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

Konfigurasi opsional:

```dotenv
MODEL_FILENAME=citrus_mobilenetv2_finetuned.h5
GEMINI_API_KEY=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
OAUTH_REDIRECT_URI=http://localhost:5000/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

## Menyiapkan database

Pastikan database yang tercantum pada `DB_NAME` sudah ada, lalu jalankan:

```powershell
python backend\setup_db.py
```

Script berjalan dalam safe mode dan tidak menjalankan `DROP TABLE`. Opsi
`--force` dapat menghapus tabel/data yang ada dan hanya boleh digunakan ketika
reset database memang disengaja.

Untuk pengembangan tanpa MySQL, gunakan mode mock:

```powershell
$env:USE_MOCK_DB = "1"
```

Mode mock menyimpan data di memori sehingga data hilang ketika backend berhenti.

## Menjalankan aplikasi

Jalankan frontend dan backend sekaligus:

```powershell
npm run dev:all
```

Atau gunakan dua terminal:

```powershell
npm run dev:server
npm run dev:client
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

Untuk menjalankan backend tanpa memuat model (misalnya ketika menguji autentikasi):

```powershell
$env:SKIP_MODEL_LOAD = "1"
python backend\app.py
```

`USE_MOCK_DB` dan `SKIP_MODEL_LOAD` hanya untuk pengembangan/pengujian dan tidak
boleh digunakan pada deployment produksi.

## Model

Backend mencari model di folder `models/`. Model default adalah
`citrus_mobilenetv2_finetuned.h5`; model lain dapat dipilih melalui
`MODEL_FILENAME`. Kelas prediksi saat ini adalah Black spot, Canker, Greening,
Healthy, dan Melanose.

## Dokumentasi terkait

- [Pengujian](TESTING.md)
- [Deployment Hugging Face Spaces](DEPLOY_HUGGINGFACE_SPACES.md)
- [Dokumentasi backend](../backend/README.md)
