@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════
echo   نصب نرم‌افزار مدیریت انبار
echo ═══════════════════════════════════════════
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [خطا] Node.js نصب نیست!
    echo لطفاً از https://nodejs.org نصب کنید.
    pause
    exit /b 1
)

echo [✓] Node.js یافت شد:
node --version
echo.

:: Install dependencies
echo [۱/۴] نصب وابستگی‌ها...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [خطا] نصب وابستگی‌ها با خطا مواجه شد.
    pause
    exit /b 1
)
echo [✓] وابستگی‌ها نصب شدند.
echo.

:: Copy .env if not exists
if not exist .env (
    echo [۲/۴] ایجاد فایل .env از روی نمونه...
    copy .env.example .env >nul
    echo [✓] فایل .env ایجاد شد. لطفاً مقادیر را بررسی کنید.
) else (
    echo [۲/۴] فایل .env از قبل وجود دارد.
)
echo.

:: Create data directory
echo [۳/۴] ایجاد پوشه داده...
if not exist data mkdir data
echo [✓] پوشه data آماده است.
echo.

:: Note about migration
echo [۴/۴] توجه:
echo   Migration دیتابیس به صورت خودکار هنگام اجرای برنامه انجام می‌شود.
echo   برای اجرای دستی: node server/index.js
echo.

echo ═══════════════════════════════════════════
echo   نصب با موفقیت انجام شد!
echo   برای اجرا: start.bat یا npm start
echo ═══════════════════════════════════════════
echo.
pause
