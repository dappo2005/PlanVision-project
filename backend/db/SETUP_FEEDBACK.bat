@echo off
REM =====================================================
REM Setup Feedback System untuk PlantVision
REM =====================================================

echo.
echo ===================================================
echo   PlantVision - Feedback System Setup
echo ===================================================
echo.

REM Prompt untuk MySQL credentials
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD="Enter MySQL password: "
if "%MYSQL_PASSWORD%"=="" (
    echo Error: Password tidak boleh kosong!
    pause
    exit /b 1
)

echo.
echo Menjalankan setup database...
echo.

REM Run SQL script
mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% < setup_feedback.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   Setup Berhasil!
    echo ===================================================
    echo.
    echo Tabel yang dibuat:
    echo   - Feedback
    echo   - FeedbackResponse
    echo.
    echo User role updated untuk support superadmin
    echo.
    echo Anda sekarang dapat menjalankan backend dan
    echo menggunakan fitur feedback system.
    echo.
) else (
    echo.
    echo ===================================================
    echo   Setup Gagal!
    echo ===================================================
    echo.
    echo Silakan periksa:
    echo   1. MySQL credentials Anda
    echo   2. MySQL service sudah berjalan
    echo   3. Database plantvision_db sudah ada
    echo.
)

pause
