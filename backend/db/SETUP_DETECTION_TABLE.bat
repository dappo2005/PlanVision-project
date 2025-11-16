@echo off
REM Setup Detection History Table (SAFE - tidak hapus data user)
REM Updated: 2025-11-16

echo ================================================
echo   Setup Tabel DetectionHistory
echo ================================================
echo.

set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=D@ffa_2005
set DB_NAME=plantvision_db

echo [INFO] Membuat tabel DetectionHistory...
echo.

"%MYSQL_PATH%" -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% < setup_detection_history.sql

if errorlevel 1 (
    echo.
    echo [ERROR] Gagal membuat tabel!
    echo.
    echo Kemungkinan masalah:
    echo 1. Tabel User belum ada atau struktur berbeda
    echo 2. Koneksi database gagal
    echo.
    echo Solusi manual: Buka MySQL Workbench dan jalankan query:
    type setup_detection_history.sql
    pause
    exit /b 1
)

echo.
echo [OK] Tabel DetectionHistory berhasil dibuat!
echo.

echo Verifikasi tabel...
"%MYSQL_PATH%" -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SHOW TABLES;"

echo.
pause
