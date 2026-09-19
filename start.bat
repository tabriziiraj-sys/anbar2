@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════
echo   اجرای نرم‌افزار مدیریت انبار
echo ═══════════════════════════════════════════
echo.

:: Check .env
if not exist .env (
    echo [خطا] فایل .env وجود ندارد!
    echo ابتدا install.bat را اجرا کنید.
    pause
    exit /b 1
)

:: Create data directory
if not exist data mkdir data

echo [i] شروع سرور...
echo [i] آدرس: http://localhost:3000
echo.

:: Open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start server
node server/index.js

pause
