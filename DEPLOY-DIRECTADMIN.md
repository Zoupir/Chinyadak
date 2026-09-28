# استقرار ChinPart روی DirectAdmin

این branch برای اجرای مستقل Node.js + MySQL آماده شده است.

## پیش‌نیاز
- Node.js 20 یا 22
- MySQL/MariaDB
- SSH یا Terminal
- SSL فعال
- قابلیت اجرای Node.js Application / Passenger

## 1) ساخت دیتابیس
در DirectAdmin یک دیتابیس و کاربر MySQL بسازید و اطلاعات آن را نگه دارید.

## 2) فایل env
`.env.example` را به `.env` کپی کنید و مقادیر واقعی را قرار دهید.

مقادیر مهم:
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET` حداقل 32 کاراکتر تصادفی
- `ADMIN_BOOTSTRAP_PASSWORD` حداقل 10 کاراکتر
- `APP_URL`

فایل `.env` نباید داخل Git commit شود.

## 3) نصب
```bash
npm install
npm run db:init
# فقط در اولین نصب، اگر می‌خواهید کاتالوگ فعلی پروژه وارد MySQL شود:
npm run db:seed
npm run build
```

دستور `db:init` جداول را می‌سازد و فقط اگر هیچ مدیر فعالی وجود نداشته باشد، مدیر اولیه را از env ایجاد می‌کند.

## 4) تنظیم Node.js App
- Application root: پوشه پروژه
- Startup file: `server.js`
- Environment: `NODE_ENV=production`
- Application URL: دامنه اصلی سایت

بعد از هر deploy:
```bash
npm install
npm run build
```

اگر schema تغییر کرده بود:
```bash
npm run db:init
```

سپس Node application را Restart کنید.

## 5) تست سلامت
پس از اجرا:
```
https://YOUR-DOMAIN/api/health
```

باید JSON با `ok: true` و `database: connected` برگرداند.

## نکات امنیتی
- هیچ رمز یا API Key واقعی را در repository قرار ندهید.
- رمز مدیر فقط به شکل hash در MySQL نگهداری می‌شود.
- session در Cookie از نوع HttpOnly نگهداری می‌شود.
- HTTPS باید فعال باشد؛ Cookie در Production فقط روی HTTPS ارسال می‌شود.
- پوشه پروژه و فایل `.env` نباید از وب به‌صورت مستقیم قابل دانلود باشند.

## وضعیت فعلی branch
احراز هویت مشتری و مدیر به backend منتقل شده است. کاتالوگ، سفارش، پرداخت، تنظیمات، رسانه و بخش‌هایی از پنل مدیریت هنوز باید به دیتابیس/API منتقل شوند و تا تکمیل این موارد این branch نباید به‌عنوان فروشگاه نهایی منتشر شود.


## پرداخت آنلاین واقعی

اطلاعات درگاه را فقط در فایل `.env` سرور قرار دهید. شناسه‌ها و رمزهای بانکی نباید داخل Git یا کد Frontend ذخیره شوند.

### SEP سامان
- `SEP_TERMINAL_ID`

### به‌پرداخت ملت
- `MELLAT_TERMINAL_ID`
- `MELLAT_USERNAME`
- `MELLAT_PASSWORD`

قیمت‌های فروشگاه در سیستم به تومان نگهداری می‌شوند و Backend هنگام ارسال به درگاه آن‌ها را به ریال تبدیل می‌کند.

### Cron آزادسازی رزروهای منقضی

در DirectAdmin یک Cron Job هر 5 دقیقه تنظیم کنید:

```bash
cd /PATH/TO/APP && npm run payments:release-expired
```

این Cron موجودی سفارش‌هایی را که مشتری پرداخت آن‌ها را نیمه‌کاره رها کرده آزاد می‌کند.
