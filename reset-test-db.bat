@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════
echo   ⚠️  هشدار: حذف دیتابیس تست
echo ═══════════════════════════════════════════
echo.
echo این عملیات فایل دیتابیس را حذف و دوباره ایجاد می‌کند.
echo تمام اطلاعات از بین خواهد رفت!
echo.
echo فقط برای محیط Development استفاده شود.
echo.
set /p confirm="آیا مطمئن هستید؟ (y/n): "
if /i not "%confirm%"=="y" (
    echo عملیات لغو شد.
    pause
    exit /b 0
)

echo.
echo [i] حذف دیتابیس...
if exist data\inventory.sqlite del data\inventory.sqlite
if exist data\inventory.sqlite-wal del data\inventory.sqlite-wal
if exist data\inventory.sqlite-shm del data\inventory.sqlite-shm

echo [✓] دیتابیس حذف شد.
echo [i] دیتابیس جدید هنگام اجرای برنامه ایجاد خواهد شد.
echo.
pause
