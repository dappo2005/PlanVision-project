@echo off
REM Setup Database Script untuk PlanVision
REM Author: GitHub Copilot
REM Updated: 2025-11-16

echo ================================================
echo   PlanVision - Database Setup
echo ================================================
echo.

set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=D@ffa_2005
set DB_NAME=plantvision_db

REM Set MySQL path (adjust if your MySQL is installed elsewhere)
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe

echo [INFO] Database: %DB_NAME%
echo [INFO] Host: %DB_HOST%
echo [INFO] User: %DB_USER%
echo.

REM Check if MySQL exists
if not exist "%MYSQL_PATH%" (
    echo [ERROR] MySQL tidak ditemukan di: %MYSQL_PATH%
    echo [INFO] Silakan cek lokasi instalasi MySQL Anda
    echo.
    echo Cara cari MySQL:
    echo   dir "C:\Program Files\MySQL" /s /b ^| findstr mysql.exe
    echo.
    pause
    exit /b 1
)

echo [OK] MySQL ditemukan
echo.

echo [1/3] Membuat database (jika belum ada)...
"%MYSQL_PATH%" -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"
if errorlevel 1 (
    echo [ERROR] Gagal koneksi ke MySQL. Cek kredensial!
    pause
    exit /b 1
)

echo [OK] Database sudah ada
echo.

echo [2/3] Menjalankan setup_database.sql...
"%MYSQL_PATH%" -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% < setup_database.sql
if errorlevel 1 (
    echo [ERROR] Gagal menjalankan SQL script
    pause
    exit /b 1
)

echo [OK] Tabel berhasil dibuat
echo.

echo [3/3] Verifikasi tabel...
"%MYSQL_PATH%" -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SHOW TABLES;"

echo.
echo ================================================
echo   Setup Database SELESAI!
echo ================================================
echo.
echo Tabel yang dibuat:
echo   - User (untuk login/register)
echo   - DetectionHistory (untuk simpan hasil deteksi)
echo.

pause
