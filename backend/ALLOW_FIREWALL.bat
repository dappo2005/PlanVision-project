@echo off
REM Run this file as Administrator (Right-click > Run as administrator)
echo ================================================
echo   Allow PlanVision Backend Port 5000
echo ================================================
echo.

echo Adding firewall rule...
netsh advfirewall firewall add rule name="Flask PlanVision Backend" dir=in action=allow protocol=TCP localport=5000

echo.
echo ================================================
echo   Firewall rule added successfully!
echo ================================================
echo.
echo Your backend can now be accessed from other devices
echo on the same network at: http://192.168.18.65:5000
echo.
pause
