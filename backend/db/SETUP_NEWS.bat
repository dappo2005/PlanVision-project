@echo off
setlocal
if not defined DB_HOST set "DB_HOST=localhost"
if not defined DB_NAME set "DB_NAME=plantvision_db"
REM =====================================================
REM Setup News Table - PlantVision Database
REM Run this script to create News table
REM =====================================================

echo ====================================
echo Setup News Table for PlantVision
echo ====================================
echo.

REM Check if MySQL is accessible
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL not found in PATH!
    echo Please add MySQL bin folder to PATH or run from MySQL bin directory
    echo Example: cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
    pause
    exit /b 1
)

echo [INFO] MySQL found!
echo.

REM Get MySQL credentials
if not defined DB_USER set /p DB_USER="Enter intended MySQL username: "
if not defined DB_USER (
    echo [ERROR] DB_USER is required.
    exit /b 1
)

echo.
echo [INFO] Running setup_news.sql...
echo [INFO] You will be prompted for MySQL password

mysql -h "%DB_HOST%" -u "%DB_USER%" -p "%DB_NAME%" < "%~dp0setup_news.sql"

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo [SUCCESS] News table created!
    echo ====================================
    echo.
    echo Sample data inserted:
    echo - 4 news articles with different categories
    echo.
    echo Next steps:
    echo 1. Restart backend: python app.py
    echo 2. Open News page in frontend
    echo 3. Test CRUD operations
    echo.
) else (
    echo.
    echo ====================================
    echo [ERROR] Failed to create News table
    echo ====================================
    echo.
    echo Possible causes:
    echo - Wrong MySQL password
    echo - Database plantvision_db does not exist
    echo - Insufficient permissions
    echo.
    echo Please check the error message above
    echo.
)

pause
