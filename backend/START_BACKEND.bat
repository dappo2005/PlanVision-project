@echo off
REM Quick Start Script untuk PlanVision Backend
REM Author: GitHub Copilot
REM Updated: 2025-11-16

echo ================================================
echo   PlanVision Backend - Quick Start
echo ================================================
echo.

REM Check if model exists
if not exist "..\models\efficientnet_saved\saved_model\saved_model.pb" (
    echo [ERROR] Model belum ada! Jalankan training dulu:
    echo         python train.py --epochs 20
    echo.
    pause
    exit /b 1
)

echo [OK] Model ML ditemukan
echo.

REM Activate conda environment
echo [INFO] Mengaktifkan environment conda...
call conda activate planvision-ml
if errorlevel 1 (
    echo [WARNING] Gagal activate conda environment
    echo [INFO] Lanjutkan dengan Python default...
)

echo.
echo [INFO] Memulai Flask backend...
echo [INFO] Backend akan berjalan di: http://localhost:5000
echo [INFO] Tekan Ctrl+C untuk stop
echo.
echo ================================================

python app.py

pause
