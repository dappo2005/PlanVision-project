# ============================================================
# Stage 1: Build React frontend (Vite)
# ============================================================
FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build

# ============================================================
# Stage 2: Python runtime (Flask + TensorFlow)
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# TensorFlow membutuhkan libgomp
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies (ganti tensorflow -> tensorflow-cpu agar image lebih kecil)
# sed menghapus \r (CRLF dari Windows) agar regex '^tensorflow==2.15.0$' cocok
COPY backend/requirements.txt ./requirements.txt
RUN sed -i 's/\r$//' requirements.txt \
    && sed -i 's/^tensorflow==2.15.0$/tensorflow-cpu==2.15.0/' requirements.txt \
    && pip install --no-cache-dir -r requirements.txt gunicorn

# Salin backend + model ML + hasil build frontend
COPY backend ./backend
COPY models ./models
COPY --from=frontend-build /app/build ./build

# Folder upload wajib ada
RUN mkdir -p /app/backend/uploads

ENV PYTHONUNBUFFERED=1
EXPOSE 7860

# HF Spaces expose port 7860. 1 worker agar model hanya dimuat sekali.
CMD ["sh", "-c", "cd /app/backend && gunicorn --bind 0.0.0.0:${PORT:-7860} --workers 1 --threads 8 --timeout 300 app:app"]