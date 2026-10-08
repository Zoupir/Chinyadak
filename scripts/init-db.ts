import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { INITIAL_SETTINGS } from '../src/data/mockData';

dotenv.config();

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} in .env`);
  }
}

const SYSTEM_PART_REQUEST_PAGE = {
  id: 'page-part-request',
  slug: 'part-request',
  title: 'استعلام قطعه',
  description: 'فرم تخصصی استعلام، تامین و پیگیری قطعات مورد نیاز مشتریان',
  isSystem: true,
  updatedAt: new Date().toLocaleDateString('fa-IR'),
  sections: [
    {
      id: 'part-request-hero',
      sectionKey: 'request-hero',
      title: 'استعلام و تامین قطعه خودرو',
      subtitle: 'مشخصات خودرو و قطعه را ارسال کنید تا واحد تامین، موجودی، قیمت و زمان تحویل را بررسی کند.',
      badge: 'استعلام تخصصی قطعات',
      isVisible: true,
      order: 1,
      widthPercent: 100,
      tabletWidthPercent: 100,
      mobileWidthPercent: 100
    },
    {
      id: 'part-request-form',
      sectionKey: 'request-form',
      title: 'فرم درخواست استعلام',
      isVisible: true,
      order: 2,
      widthPercent: 100,
      tabletWidthPercent: 100,
      mobileWidthPercent: 100,
      formConfig: {
        schema: 'part-request',
        submitText: 'ارسال درخواست استعلام به واحد تامین',
        submittingText: 'در حال ثبت درخواست...',
        successTitle: 'درخواست استعلام شما با موفقیت ثبت شد',
        successMessage: 'درخواست شما در سیستم ثبت شد و واحد تامین آن را بررسی می‌کند. نتیجه از طریق تماس یا پیامک اطلاع داده خواهد شد.',
        errorMessage: 'ثبت درخواست انجام نشد. موارد مشخص‌شده را بررسی و دوباره تلاش کنید.',
        contactPhone: '',
        maxImageMb: 5,
        allowImages: true,
        fields: [
          { key: 'carBrand', type: 'select', label: 'برند خودرو', placeholder: 'برند خودرو را انتخاب کنید', visible: true, required: false, width: 'third', order: 1 },
          { key: 'carModel', type: 'text', label: 'مدل دقیق خودرو', placeholder: 'مثال: KMC J7، تیگو ۸ پرو، لاماری', visible: true, required: false, width: 'third', order: 2 },
          { key: 'year', type: 'text', label: 'سال ساخت خودرو', placeholder: 'مثال: ۱۴۰۲ یا 2023', visible: true, required: false, width: 'third', order: 3 },
          { key: 'partName', type: 'text', label: 'نام قطعه مورد نظر یا شرح نیاز', placeholder: 'نام یا شرح قطعه را وارد کنید', visible: true, required: true, width: 'full', order: 4 },
          { key: 'oemNumber', type: 'text', label: 'شماره فنی / OEM', placeholder: 'شماره فنی در صورت وجود', visible: true, required: false, width: 'half', order: 5 },
          { key: 'vin', type: 'text', label: 'شماره شاسی VIN', placeholder: 'شماره شاسی در صورت وجود', visible: true, required: false, width: 'half', order: 6 },
          { key: 'image', type: 'file', label: 'تصویر قطعه، قطعه معیوب یا کارت خودرو', placeholder: 'برای انتخاب و آپلود تصویر کلیک کنید', visible: true, required: false, width: 'full', order: 7, helpText: 'JPG، PNG، WEBP یا GIF' },
          { key: 'fullName', type: 'text', label: 'نام و نام خانوادگی متقاضی', placeholder: 'نام کامل', visible: true, required: true, width: 'half', order: 8 },
          { key: 'phoneNumber', type: 'tel', label: 'شماره تلفن همراه', placeholder: '۰۹۱۲۱۲۳۴۵۶۷', visible: true, required: true, width: 'half', order: 9, helpText: 'اعداد فارسی و انگلیسی هر دو پذیرفته می‌شوند.' },
          { key: 'notes', type: 'textarea', label: 'توضیحات تکمیلی', placeholder: 'هر توضیحی که به بررسی دقیق‌تر کمک می‌کند', visible: true, required: false, width: 'full', order: 10 }
        ]
      }
    },
    {
      id: 'part-request-info',
      sectionKey: 'request-info',
      title: 'روند بررسی استعلام',
      subtitle: 'درخواست در پنل کارشناسان ثبت می‌شود و نتیجه پس از بررسی تامین اعلام خواهد شد.',
      isVisible: true,
      order: 3,
      items: [
        { id: 'request-info-1', title: 'ثبت در سیستم', content: 'درخواست شما با شناسه مستقل در مرکز استعلام ذخیره می‌شود.', isVisible: true, order: 1 },
        { id: 'request-info-2', title: 'بررسی فنی و تامین', content: 'شماره فنی، خودرو، موجودی و شرایط تامین بررسی می‌شود.', isVisible: true, order: 2 },
        { id: 'request-info-3', title: 'اعلام نتیجه', content: 'قیمت و زمان تقریبی تامین توسط کارشناس اعلام می‌شود.', isVisible: true, order: 3 }
      ]
    },
    {
      id: 'part-request-contact',
      sectionKey: 'request-contact',
      title: 'نیاز به استعلام تلفنی فوری دارید؟',
      subtitle: 'می‌توانید مستقیماً با واحد تامین تماس بگیرید.',
      buttonText: 'تماس با واحد تامین',
      buttonLink: '',
      isVisible: true,
      order: 4
    }
  ]
};

const main = async () => {
  const schemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  const ensureColumn = async (
    tableName: string,
    columnName: string,
    definition: string
  ): Promise<void> => {
    const [rows] = await connection.query<any[]>(
      `SELECT 1
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [tableName, columnName]
    );

    if (!rows.length) {
      await connection.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
      );
    }
  };

  try {
    await connection.query(schema);

    // Forward-compatible migrations for databases created by older releases.
    await ensureColumn('products', 'data_json', 'JSON NULL');
    await ensureColumn('products', 'reserved_stock', 'INT NOT NULL DEFAULT 0');
    await ensureColumn('orders', 'reservation_expires_at', 'DATETIME NULL');
    await ensureColumn('admin_users', 'avatar_url', 'TEXT NULL');
    await ensureColumn('customers', 'password_initialized', 'TINYINT(1) NOT NULL DEFAULT 1');

    await connection.query(
      `ALTER TABLE payment_transactions
       MODIFY gateway_order_id BIGINT UNSIGNED NULL`
    );

    await connection.query(
      `UPDATE products
       SET data_json = JSON_OBJECT(
         'id', id,
         'sku', sku,
         'slug', slug,
         'nameFa', name_fa,
         'nameEn', COALESCE(name_en, ''),
         'oemNumber', COALESCE(oem_number, ''),
         'partNumber', COALESCE(part_number, ''),
         'categorySlug', category_slug,
         'brandManufacturer', COALESCE(manufacturer, ''),
         'grade', COALESCE(grade, 'aftermarket'),
         'price', price,
         'discountPrice', discount_price,
         'stock', stock,
         'stockStatus', CASE
           WHEN stock <= 0 THEN 'out_of_stock'
           WHEN stock <= 3 THEN 'low_stock'
           ELSE 'in_stock'
         END,
         'images', COALESCE(images_json, JSON_ARRAY()),
         'technicalSpecs', COALESCE(specs_json, JSON_OBJECT()),
         'fitments', COALESCE(fitments_json, JSON_ARRAY()),
         'shortDescription', COALESCE(short_description, ''),
         'description', COALESCE(description, '')
       )
       WHERE data_json IS NULL`
    );

    await connection.query(
      `ALTER TABLE products MODIFY data_json JSON NOT NULL`
    );

    // Guarantee that the form is manageable from the CMS even on older or fresh
    // installations. INSERT IGNORE is intentional: existing admin edits are sacred.
    await connection.execute(
      `INSERT IGNORE INTO site_pages (id, slug, title, is_system, data_json)
       VALUES (?, ?, ?, 1, ?)`,
      [
        SYSTEM_PART_REQUEST_PAGE.id,
        SYSTEM_PART_REQUEST_PAGE.slug,
        SYSTEM_PART_REQUEST_PAGE.title,
        JSON.stringify(SYSTEM_PART_REQUEST_PAGE)
      ]
    );

    // Upgrade only the untouched legacy starter settings. Any edited store settings
    // are left intact; unrelated fields are preserved while the new visual defaults apply.
    const [siteSettingRows] = await connection.query<any[]>(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'site_settings' LIMIT 1"
    );
    const storedSiteSettings = siteSettingRows[0]?.setting_value;
    const currentSiteSettings = typeof storedSiteSettings === 'string'
      ? JSON.parse(storedSiteSettings)
      : storedSiteSettings;
    const legacyStarterSignature: Record<string, unknown> = {
      siteTitle: 'فروشگاه قطعات خودرو',
      siteSlogan: 'مرجع رسمی و تخصصی لوازم یدکی و قطعات فابریک با سیستم فیتمنت هوشمند',
      contactPhone: '۰۲۱-۸۸۹۹۲۲۱۱',
      supportPhone: '۰۹۱۲۳۴۵۶۷۸۹',
      supportEmail: 'support@chinpart.ir',
      address: 'تهران، خیابان امیرکبیر (چراغ برق)، کوچه سراج، پاساژ کاشانی، طبقه همکف، پلاک ۲۸',
      themeMode: 'dark',
      layoutPreset: 'classic',
      primaryColor: '#DC2626',
      siteBgColor: '#0a0a0a'
    };
    const isUntouchedLegacyStarter = currentSiteSettings &&
      Object.entries(legacyStarterSignature).every(([key, value]) => currentSiteSettings[key] === value);

    if (isUntouchedLegacyStarter) {
      const upgradedSiteSettings = {
        ...currentSiteSettings,
        siteTitle: INITIAL_SETTINGS.siteTitle,
        siteSlogan: INITIAL_SETTINGS.siteSlogan,
        contactPhone: INITIAL_SETTINGS.contactPhone,
        supportPhone: INITIAL_SETTINGS.supportPhone,
        supportEmail: INITIAL_SETTINGS.supportEmail,
        address: INITIAL_SETTINGS.address,
        announcementText: INITIAL_SETTINGS.announcementText,
        primaryColor: INITIAL_SETTINGS.primaryColor,
        primaryHover: INITIAL_SETTINGS.primaryHover,
        accentGlowColor: INITIAL_SETTINGS.accentGlowColor,
        themeMode: INITIAL_SETTINGS.themeMode,
        layoutPreset: INITIAL_SETTINGS.layoutPreset,
        siteBgColor: INITIAL_SETTINGS.siteBgColor,
        cardBgColor: INITIAL_SETTINGS.cardBgColor,
        headerBgColor: INITIAL_SETTINGS.headerBgColor,
        footerBgColor: INITIAL_SETTINGS.footerBgColor,
        textColor: INITIAL_SETTINGS.textColor,
        metaTitle: INITIAL_SETTINGS.metaTitle,
        metaDescription: INITIAL_SETTINGS.metaDescription,
        ogTitle: INITIAL_SETTINGS.ogTitle,
        ogDescription: INITIAL_SETTINGS.ogDescription,
        ogImageUrl: INITIAL_SETTINGS.ogImageUrl
      };
      await connection.execute(
        "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'site_settings'",
        [JSON.stringify(upgradedSiteSettings)]
      );
      console.log('Upgraded untouched legacy starter settings to the marketplace storefront.');
    }
  } finally {
    await connection.end();
  }

  const { bootstrapAdminIfNeeded } = await import('../src/server/bootstrap');
  const { pool, withTransaction, awardPaidOrderLoyalty } = await import('../src/server/db');
  try {
    await bootstrapAdminIfNeeded();
    const [codOrders] = await pool.query<any[]>("SELECT id FROM orders WHERE payment_method = 'cod' AND status = 'delivered' AND customer_id IS NOT NULL");
    for (const order of codOrders) await withTransaction(async tx => {
      await tx.execute("UPDATE orders SET payment_status = 'paid', paid_at = COALESCE(paid_at, NOW()) WHERE id = ? AND status = 'delivered' AND payment_method = 'cod'", [order.id]);
      await awardPaidOrderLoyalty(tx, order.id);
    });
    console.log(`Reconciled ${codOrders.length} delivered COD orders (loyalty is idempotent).`);
    console.log('Database schema and initial administrator are ready.');
  } finally {
    await pool.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
