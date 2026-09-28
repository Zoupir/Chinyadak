# استقرار ChinPart روی DirectAdmin

این branch برای اجرای مستقل Node.js + MySQL آماده شده است.

## پیش‌نیاز
- Node.js 22 (پیشنهادی؛ CI رسمی پروژه روی Node 22 اجرا می‌شود)
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
- `APP_ENCRYPTION_KEY` حداقل 32 کاراکتر و متفاوت از JWT_SECRET
- `UPLOAD_DIR` برای فایل‌های رسانه‌ای پایدار

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

ساختار Production این branch کامل شده است:
- احراز هویت مشتری و مدیر روی Backend با Cookie امن HttpOnly
- RBAC سمت سرور برای مدیران
- کاتالوگ، برند/مدل خودرو، CRM، سفارش، وفاداری، CMS، صفحات، اسلایدر و تنظیمات روی MySQL/MariaDB
- آپلود واقعی رسانه روی هاست
- رمزنگاری Secretهای SMS/Accounting/Webhook
- درگاه SEP سامان و به‌پرداخت ملت با verify سمت سرور
- رزرو و کسر موجودی تراکنشی
- URLهای استاندارد بدون Hash
- canonical، robots، sitemap و JSON-LD سمت سرور
- استعلام قطعه، هشدار موجودی و آمار جستجو روی دیتابیس
- CI با Build و Smoke Test روی MySQL 8.4 و MariaDB 11.4

قبل از Live فقط Credential واقعی سرویس‌ها/بانک و تست Staging با حساب خودتان لازم است.


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


## رسانه‌ها و Secretهای سرویس‌ها

در `.env` حتماً یک `APP_ENCRYPTION_KEY` مستقل و تصادفی با حداقل 32 کاراکتر قرار دهید. این مقدار برای رمزنگاری API Key پیامک، کلید حسابداری و Webhook Secret استفاده می‌شود و نباید با `JWT_SECRET` یکسان باشد.

فایل‌های آپلودشده در مسیر تعیین‌شده توسط `UPLOAD_DIR` ذخیره می‌شوند. مقدار پیش‌فرض:

```
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=8
```

پوشه `uploads` باید برای کاربر Node.js قابل نوشتن باشد و در deployهای بعدی حذف نشود. این پوشه داخل Git نگهداری نمی‌شود.

فرمت‌های فایل تصویری قابل آپلود: JPG، PNG، WEBP و GIF. SVG عمداً برای جلوگیری از اجرای محتوای فعال در آپلود مستقیم پذیرفته نمی‌شود.


## چک‌لیست Launch

1. دامنه نهایی را در `APP_URL` با HTTPS تنظیم کنید.
2. `JWT_SECRET` و `APP_ENCRYPTION_KEY` را دو مقدار تصادفی و مستقل قرار دهید.
3. `npm run db:init` را اجرا کنید.
4. فقط در نصب اولیه، در صورت نیاز به داده فعلی پروژه، `npm run db:seed` را اجرا کنید.
5. `npm run build` و سپس Restart برنامه Node.js.
6. آدرس `/api/health` باید `database: connected` برگرداند.
7. `/sitemap.xml` و `/robots.txt` را بررسی کنید.
8. مجوز نوشتن پوشه `UPLOAD_DIR` را بررسی کنید.
9. Cron آزادسازی رزرو پرداخت را فعال کنید.
10. Credential واقعی SEP/Mellat را ابتدا روی Staging تست کنید و سپس Live کنید.
11. نشان‌های اعتماد/مجوز در Footer به‌صورت پیش‌فرض خاموش هستند؛ فقط کد واقعی متعلق به فروشگاه را در پنل وارد و فعال کنید.

### URLهای SEO

مسیرهای عمومی به شکل استاندارد هستند، برای مثال:

```
/product/product-slug
/category/category-slug
/brand/brand-slug
/car-model/model-slug
/article/article-slug
```

صفحات خصوصی مانند `/admin`، `/account`، `/checkout` و `/tracking` با `noindex` سرو می‌شوند.
