# استقرار روی Liara

## پیش‌نیازها

- اکانت Liara
- CLI لیارا (`npm i -g @liara/cli`)

## مراحل Deploy

### ۱. آماده‌سازی

```bash
# مطمئن شوید .env داخل Git نیست
cat .gitignore | grep .env

# فایل liara.json ایجاد کنید (اختیاری)
```

### ۲. تنظیم Environment Variables در پنل Liara

در پنل لیارا، متغیرهای زیر را تنظیم کنید:

```
NODE_ENV=production
PORT=3000
DB_FILE=/persistent/inventory.sqlite
BETTER_AUTH_SECRET=<یک-secret-تصادفی-طولانی>
BETTER_AUTH_URL=https://your-app.liara.run
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<رمز-قوی>
```

### ۳. فعال‌سازی Persistent Storage

در پنل لیارا:
1. به بخش **Disks** بروید
2. یک Disk جدید بسازید
3. Mount Path را `/persistent` قرار دهید
4. اپلیکیشن را به این Disk متصل کنید

> ⚠️ **مهم**: بدون Persistent Storage، با هر Redeploy دیتابیس حذف می‌شود!

### ۴. Deploy

```bash
liara deploy
```

### ۵. بررسی

بعد از deploy:
1. به آدرس اپلیکیشن بروید
2. با اطلاعات Admin وارد شوید
3. مطمئن شوید اطلاعات ذخیره می‌شود

## نکات مهم

### Persistent Storage

- مسیر `/persistent` روی دیسک پایدار mount می‌شود
- `DB_FILE` باید به این مسیر اشاره کند
- بدون آن، اطلاعات با هر restart از بین می‌رود

### Backup

برای backup از فایل دیتابیس:

```bash
# از طریق Liara Shell
liara shell
cp /persistent/inventory.sqlite /tmp/backup.sqlite
```

یا به صورت دوره‌ای از Liara Shell فایل را دانلود کنید.

### Performance

SQLite برای استفاده تک‌instance مناسب است. اگر نیاز به چند replica دارید، باید به PostgreSQL مهاجرت کنید.

### Security

- `BETTER_AUTH_SECRET` را حتماً تغییر دهید
- رمز Admin اولیه را بعد از اولین ورود تغییر دهید
- HTTPS توسط Liara به صورت خودکار فعال می‌شود

## عیب‌یابی

### خطای Database Locked

- مطمئن شوید فقط یک instance اجرا می‌شود
- `busy_timeout` در کد تنظیم شده (5000ms)

### اطلاعات بعد از Redeploy از بین رفته

- Persistent Storage فعال نیست
- `DB_FILE` به مسیر درست اشاره نمی‌کند

### خطای Permission

- مطمئن شوید Disk به درستی mount شده
- مسیر `/persistent` writable باشد
