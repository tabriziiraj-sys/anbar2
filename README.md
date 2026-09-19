# سیستم مدیریت انبار

نرم‌افزار تحت وب مدیریت انبار با قابلیت ثبت ورود، خروج و اصلاح موجودی کالا.

## پیش‌نیازها

- Node.js نسخه 18 یا بالاتر
- npm

## نصب

```bash
# نصب وابستگی‌ها
npm install

# یا در ویندوز:
install.bat
```

## تنظیمات

فایل `.env` را از روی `.env.example` کپی کنید و مقادیر را تنظیم کنید:

```bash
cp .env.example .env
```

متغیرهای مهم:

| متغیر | توضیح | پیش‌فرض |
|--------|--------|---------|
| `PORT` | پورت سرور | `3000` |
| `DB_FILE` | مسیر فایل SQLite | `./data/inventory.sqlite` |
| `BETTER_AUTH_SECRET` | کلید امنیتی Session | - |
| `BETTER_AUTH_URL` | آدرس برنامه | `http://localhost:3000` |
| `ADMIN_EMAIL` | ایمیل ادمین اولیه | `admin@example.com` |
| `ADMIN_PASSWORD` | رمز ادمین اولیه | `ChangeMe123!` |

## اجرا

```bash
# Development
node server/index.js

# یا در ویندوز:
start.bat
```

برنامه روی `http://localhost:3000` قابل دسترسی است.

## ورود اولیه

با اطلاعات زیر وارد شوید:
- ایمیل: `admin@example.com`
- رمز: `ChangeMe123!`

## ساختار پروژه

```
├── server/              # Backend
│   ├── index.js         # Entry point
│   ├── config.js        # Configuration
│   ├── db.js            # Database + Schema
│   ├── auth.js          # Better Auth
│   ├── middleware.js     # Auth + Helpers
│   └── routes/          # API Routes
├── public/              # Frontend Static Files
│   ├── css/style.css
│   └── js/
├── data/                # SQLite Database (auto-created)
├── .env.example
├── install.bat
├── start.bat
└── drizzle.config.js
```

## معماری

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript (SPA)
- **Backend**: Node.js + Express.js
- **Database**: SQLite (better-sqlite3)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth

## محل دیتابیس

فایل SQLite در مسیر تعیین‌شده توسط `DB_FILE` ذخیره می‌شود.
پوشه `data` به صورت خودکار ایجاد می‌شود.

## Backup

برای پشتیبان‌گیری امن از دیتابیس:

```bash
# روش ۱: کپی مستقیم (سرور خاموش باشد)
cp data/inventory.sqlite backup/inventory-$(date +%Y%m%d).sqlite

# روش ۲: استفاده از SQLite backup command
sqlite3 data/inventory.sqlite ".backup 'backup/inventory-$(date +%Y%m%d).sqlite'"
```

> نکته: اگر WAL mode فعال باشد، فایل‌های `.sqlite-wal` و `.sqlite-shm` نیز باید کپی شوند.

## Migration

Migrationها به صورت خودکار هنگام شروع برنامه اجرا می‌شوند.

## مجوز

MIT
