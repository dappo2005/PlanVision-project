@echo off
REM Quick Start Script untuk PlanVision Backend
REM Author: GitHub Copilot
REM Updated: 2025-11-16

echo ================================================
echo   PlanVision Backend - Quick Start
echo ================================================
echo.

REM Check if model exists
if not exist "..\models\citrus_mobilenetv2_finetuned.h5" (
    if not exist "..\models\citrus_efficientnet_finetuned.h5" (
        echo [ERROR] Model belum ada! Jalankan training dulu:
        echo         python train.py --epochs 20
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Model ML ditemukan
echo.

REM Activate Python environment
if exist ".venv\Scripts\activate.bat" (
    echo [INFO] Mengaktifkan environment .venv...
    call .venv\Scripts\activate.bat
) else (
    echo [INFO] Mengaktifkan environment conda...
    call conda activate planvision-ml
    if errorlevel 1 (
        echo [WARNING] Gagal activate conda atau .venv environment
        echo [INFO] Lanjutkan dengan Python default...
    )
)

echo.
echo [INFO] Memulai Flask backend...
echo [INFO] Backend akan berjalan di: http://localhost:5000
echo [INFO] Tekan Ctrl+C untuk stop
echo.
echo ================================================

python app.py

pause
