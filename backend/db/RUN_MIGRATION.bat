@echo off
REM ===================================================================
REM BATCH FILE: MIGRATE TO DETECTION HISTORY
REM ===================================================================
REM Script ini akan menjalankan migrasi database ke DetectionHistory
REM Pastikan MySQL sudah berjalan sebelum menjalankan script ini
REM ===================================================================

echo.
echo ===================================================================
echo  PLANTVISION - MIGRATE TO DETECTION HISTORY
echo ===================================================================
echo.
echo [INFO] Script ini akan mengupdate database untuk menggunakan
echo        tabel DetectionHistory sebagai storage utama deteksi.
echo.
echo [WARN] Pastikan MySQL sudah berjalan!
echo [WARN] Backup database Anda sebelum melanjutkan!
echo.

pause

echo.
echo [1/2] Mencari MySQL...

REM Cek berbagai lokasi instalasi MySQL yang umum
set MYSQL_PATH=

if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    echo [OK] MySQL ditemukan: MySQL Server 8.0
    goto :found
)

if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
    echo [OK] MySQL ditemukan: MySQL Server 5.7
    goto :found
)

if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH="C:\xampp\mysql\bin\mysql.exe"
    echo [OK] MySQL ditemukan: XAMPP
    goto :found
)

if exist "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe" (
    set MYSQL_PATH="C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe"
    echo [OK] MySQL ditemukan: WAMP
    goto :found
)

REM Coba cari di PATH
where mysql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set MYSQL_PATH=mysql
    echo [OK] MySQL ditemukan di system PATH
    goto :found
)

:notfound
echo [ERROR] MySQL tidak ditemukan!
echo.
echo Pastikan MySQL sudah terinstall, atau edit script ini
echo untuk menambahkan path MySQL Anda.
echo.
pause
exit /b 1

:found
echo.
echo [2/2] Menjalankan migration script...
echo.

REM Jalankan SQL script
%MYSQL_PATH% -u root -p -e "source %~dp0MIGRATE_TO_DETECTION_HISTORY.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================================
    echo  MIGRATION BERHASIL!
    echo ===================================================================
    echo.
    echo [OK] Tabel DetectionHistory sudah siap digunakan.
    echo [OK] Endpoint /api/predict sekarang menyimpan ke DetectionHistory.
    echo [OK] Riwayat deteksi bisa dilihat di /detection-history.
    echo.
    echo NEXT STEPS:
    echo 1. Restart backend server (python app.py)
    echo 2. Test deteksi penyakit di aplikasi
    echo 3. Cek riwayat deteksi di menu "Riwayat Deteksi"
    echo.
) else (
    echo.
    echo [ERROR] Migration gagal!
    echo        Periksa error message di atas.
    echo.
)

pause
