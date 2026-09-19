# استقرار روی Liara (روش فایل ZIP)

## پیش‌نیازها

- اکانت Liara
- یک اپلیکیشن Node.js ساخته‌شده در پنل Liara

---

## مرحله ۱: ساخت اپلیکیشن در پنل Liara

1. وارد پنل Liara شوید: https://console.liara.ir
2. روی **ایجاد اپلیکیشن** کلیک کنید
3. پلن **Node.js** را انتخاب کنید
4. نام اپلیکیشن را وارد کنید (مثلاً `inventory-app`)
5. اپلیکیشن را بسازید

---

## مرحله ۲: اضافه کردن Persistent Disk

> ⚠️ **بسیار مهم**: بدون Persistent Disk، با هر بار Redeploy یا Restart، تمام اطلاعات دیتابیس از بین می‌رود!

1. در پنل Liara، وارد اپلیکیشن شوید
2. از منوی سمت راست، به بخش **دیسک‌ها** بروید
3. روی **افزودن دیسک** کلیک کنید
4. نام دیسک: `data`
5. مسیر Mount: `/persistent`
6. حجم مناسب انتخاب کنید (حداقل 1GB)
7. دیسک را بسازید و به اپلیکیشن متصل کنید

---

## مرحله ۳: تنظیم Environment Variables

در پنل Liara، به بخش **متغیرهای محیطی** بروید و مقادیر زیر را اضافه کنید:

| متغیر | مقدار | توضیح |
|--------|--------|--------|
| `NODE_ENV` | `production` | محیط اجرا |
| `PORT` | `3000` | پورت (Liara خودش تنظیم می‌کند) |
| `DB_FILE` | `/persistent/inventory.sqlite` | مسیر دیتابیس روی دیسک پایدار |
| `BETTER_AUTH_SECRET` | *(یک رشته تصادفی طولانی)* | کلید امنیتی Session |
| `BETTER_AUTH_URL` | `https://inventory-app.liara.run` | آدرس کامل اپلیکیشن شما |
| `ADMIN_NAME` | `مدیر سیستم` | نام ادمین اولیه |
| `ADMIN_EMAIL` | `admin@example.com` | ایمیل ادمین اولیه |
| `ADMIN_PASSWORD` | *(رمز قوی - حداقل ۸ کاراکتر)* | رمز ادمین اولیه |

### تولید BETTER_AUTH_SECRET تصادفی:

در terminal محلی اجرا کنید:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

خروجی را در `BETTER_AUTH_SECRET` قرار دهید.

---

## مرحله ۴: آماده‌سازی فایل ZIP

### روش ۱: ساخت ZIP دستی

1. مطمئن شوید فایل‌های زیر در پروژه وجود دارند:
   - `package.json`
   - `package-lock.json`
   - `liara.json`
   - `server/` (پوشه کامل)
   - `public/` (پوشه کامل)
   - `index.html`
   - `.env.example`

2. فایل‌های زیر **نباید** در ZIP باشند:
   - `node_modules/`
   - `data/`
   - `.env`
   - `*.bat`
   - `src/`
   - `tsconfig.json`

3. تمام فایل‌های مورد نیاز را انتخاب و ZIP کنید:

**در Windows (PowerShell):**
```powershell
# از ریشه پروژه اجرا کنید
Compress-Archive -Path "package.json","package-lock.json","liara.json","server","public","index.html",".env.example",".liaraignore" -DestinationPath "inventory-deploy.zip"
```

**در Linux/Mac:**
```bash
zip -r inventory-deploy.zip \
  package.json \
  package-lock.json \
  liara.json \
  server/ \
  public/ \
  index.html \
  .env.example \
  .liaraignore
```

### روش ۲: استفاده از Liara CLI

```bash
# نصب Liara CLI
npm i -g @liara/cli

# ورود به اکانت
liara login

# دیپلوی مستقیم (بدون نیاز به ZIP)
liara deploy --app inventory-app
```

> Liara CLI به صورت خودکار فایل‌های اضافی را با توجه به `.liaraignore` حذف می‌کند.

---

## مرحله ۵: آپلود ZIP در پنل Liara

1. در پنل Liara، وارد اپلیکیشن شوید
2. از منوی سمت راست، به بخش **استقرار** بروید
3. روی **استقرار با فایل ZIP** کلیک کنید
4. فایل `inventory-deploy.zip` را آپلود کنید
5. صبر کنید تا استقرار کامل شود

---

## مرحله ۶: بررسی استقرار

بعد از اتمام استقرار:

1. **بررسی لاگ‌ها**: در بخش لاگ‌ها، باید پیام‌های زیر را ببینید:
   ```
   Running database migrations...
   Migrations completed.
   Admin user created: admin@example.com
   Seeding initial data...
   ✅ نرم‌افزار مدیریت انبار اجرا شد
   📍 آدرس: http://localhost:3000
   ```

2. **باز کردن اپلیکیشن**: آدرس `https://inventory-app.liara.run` را باز کنید

3. **ورود با Admin**:
   - ایمیل: مقداری که در `ADMIN_EMAIL` تنظیم کردید
   - رمز: مقداری که در `ADMIN_PASSWORD` تنظیم کردید

---

## مرحله ۷: تغییر رمز Admin

بعد از اولین ورود، حتماً رمز Admin را تغییر دهید:

1. وارد بخش **کاربران** شوید
2. روی **ویرایش** کنار Admin کلیک کنید
3. رمز جدید وارد کنید
4. ذخیره کنید

---

## بروزرسانی (Update)

برای بروزرسانی اپلیکیشن:

1. تغییرات را اعمال کنید
2. ZIP جدید بسازید
3. در پنل Liara → استقرار → آپلود ZIP جدید
4. صبر کنید تا استقرار کامل شود

> اطلاعات دیتابیس روی Persistent Disk حفظ می‌شود.

---

## عیب‌یابی

### خطای "Cannot find module"
- مطمئن شوید `package-lock.json` در ZIP وجود دارد
- مطمئن شوید `npm install` در لاگ‌ها بدون خطا اجرا شده

### خطای "EROFS: read-only file system"
- `DB_FILE` به مسیر `/persistent/` اشاره نمی‌کند
- Persistent Disk متصل نشده است

### اطلاعات بعد از Redeploy از بین رفت
- Persistent Disk فعال نیست
- `DB_FILE` مقدار اشتباه دارد (باید `/persistent/inventory.sqlite` باشد)

### خطای "database is locked"
- چند instance همزمان اجرا شده
- مطمئن شوید فقط یک Replica فعال است

### صفحه سفید بعد از ورود
- `BETTER_AUTH_URL` اشتباه تنظیم شده
- باید دقیقاً آدرس اپلیکیشن Liara باشد: `https://inventory-app.liara.run`

### خطای 401 بعد از Login
- Cookieها به درستی ست نمی‌شوند
- `BETTER_AUTH_URL` باید با پروتکل `https` باشد

---

## Backup از دیتابیس

### روش ۱: از طریق Liara Shell

```bash
# وارد Liara Shell شوید
liara shell --app inventory-app

# کپی فایل دیتابیس
cp /persistent/inventory.sqlite /tmp/backup.sqlite

# دانلود (از طریق Liara Shell امکان‌پذیر است)
```

### روش ۲: دوره‌ای

یک اسکریپت ساده برای backup:
```bash
# روی سرور محلی یا CI/CD
liara shell --app inventory-app --command "cp /persistent/inventory.sqlite /tmp/backup-$(date +%Y%m%d).sqlite"
```

> نکته: فایل‌های WAL و SHM نیز بخشی از دیتابیس هستند. برای backup کامل، سرور را موقتاً متوقف کنید یا از `sqlite3 .backup` استفاده کنید.

---

## ساختار فایل‌های ZIP

```
inventory-deploy.zip
├── package.json
├── package-lock.json
├── liara.json
├── index.html
├── .env.example
├── .liaraignore
├── server/
│   ├── index.js
│   ├── config.js
│   ├── db.js
│   ├── auth.js
│   ├── middleware.js
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── products.js
│       ├── reference-data.js
│       ├── warehouses.js
│       ├── inventory.js
│       └── analytics.js
└── public/
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js
        └── app.js
```

---

## تنظیمات liara.json

```json
{
  "app": "inventory-app",
  "command": "node server/index.js",
  "build": {
    "command": "npm run build"
  },
  "disks": [
    {
      "name": "data",
      "mountTo": "/persistent"
    }
  ]
}
```

| فیلد | توضیح |
|-------|--------|
| `app` | نام اپلیکیشن در Liara |
| `command` | دستور اجرای برنامه |
| `build.command` | دستور build قبل از اجرا |
| `disks` | تنظیمات Persistent Disk |

---

## خلاصه سریع

1. ✅ ساخت اپلیکیشن Node.js در Liara
2. ✅ اضافه کردن Persistent Disk (mount: `/persistent`)
3. ✅ تنظیم Environment Variables (مخصوصاً `DB_FILE=/persistent/inventory.sqlite`)
4. ✅ ساخت ZIP از فایل‌های پروژه (بدون node_modules)
5. ✅ آپلود ZIP در پنل Liara
6. ✅ بررسی لاگ‌ها و ورود با Admin
7. ✅ تغییر رمز Admin
