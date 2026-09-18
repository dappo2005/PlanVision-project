# PlantVision

PlantVision adalah aplikasi web untuk mendeteksi penyakit daun jeruk dari citra.
Aplikasi menggabungkan frontend React, API Flask, database MySQL, dan model
TensorFlow untuk klasifikasi lima kondisi daun.

## Fitur utama

- registrasi, login, Google OAuth, dan reset password;
- deteksi penyakit daun serta rekomendasi penanganan;
- riwayat deteksi dan ekspor laporan;
- feedback pengguna, berita, dan dashboard admin;
- chat AI opsional melalui Gemini;
- mock database untuk pengembangan dan pengujian terisolasi.

## Teknologi

- **Frontend:** React 18, TypeScript, Vite, Radix UI
- **Backend:** Flask, Python 3.11, Gunicorn
- **Data:** MySQL atau mock database in-memory
- **Machine learning:** TensorFlow 2.15, MobileNetV2/EfficientNet
- **Deployment:** Docker, Railway, Render, Vercel, atau Hugging Face Spaces

## Struktur repository

```text
├── backend/           API Flask, keamanan, schema, dan utilitas backend
├── docs/              dokumentasi pengembangan, testing, dan deployment
├── models/            model TensorFlow yang dipakai saat inference
├── public/            aset statis frontend
├── src/               aplikasi React/TypeScript
├── Dockerfile         image gabungan frontend dan backend
├── package.json       dependencies dan script Node.js
└── vite.config.ts     konfigurasi Vite (port lokal 3000)
```

## Mulai cepat

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
npm run dev:all
```

Setelah berjalan:

- frontend: `http://localhost:3000`
- backend: `http://localhost:5000`
- health check: `http://localhost:5000/api/health`

Mode lokal tanpa MySQL dan tanpa memuat model dapat diaktifkan sebelum backend
dijalankan:

```powershell
$env:USE_MOCK_DB = "1"
$env:SKIP_MODEL_LOAD = "1"
npm run dev:all
```

Lihat [panduan pengembangan](docs/DEVELOPMENT.md) untuk konfigurasi database,
model, OAuth, email, dan cara menjalankan service secara terpisah.

## Pengujian

```powershell
python -m pytest backend\tests -q
npm run build
```

Rincian skenario tersedia dalam [panduan pengujian](docs/TESTING.md).

## Deployment

- Konfigurasi Railway: `railway.json`
- Konfigurasi Render: `render.yaml`
- Konfigurasi frontend Vercel: `vercel.json`
- Image aplikasi penuh: `Dockerfile`
- Panduan khusus: [Hugging Face Spaces](docs/DEPLOY_HUGGINGFACE_SPACES.md)

Jangan commit file `.env` atau kredensial. Pada produksi, gunakan secret/environment
variables dari penyedia deployment dan jangan aktifkan `USE_MOCK_DB` maupun
`SKIP_MODEL_LOAD`.

## Tim

- Daffa — Developer
- Aisyah — Developer
- Refael — Developer
- Imam — Developer

Lihat [atribusi aset dan komponen](docs/ATTRIBUTIONS.md).
