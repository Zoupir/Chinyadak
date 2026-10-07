import 'dotenv/config';
import { createHash } from 'node:crypto';
import { pool, type RowDataPacket } from '../src/server/db';
import { PART_MANUFACTURERS } from '../src/data/realCatalogDefaults';

const slugify = (value: string): string => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 180);

const stableLegacyId = (value: string): string =>
  `part-brand-${createHash('sha1').update(value.trim().toLowerCase()).digest('hex').slice(0, 14)}`;

const normalizeName = (value: unknown): string => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[\u200c\u200f\u202a-\u202e\u2066-\u2069]/g, '')
  .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const defaultPartBrand = (item: typeof PART_MANUFACTURERS[number]) => ({
  id: item.id,
  nameFa: item.nameFa,
  nameEn: item.nameEn,
  slug: item.id,
  logo: item.logoUrl || '',
  heroImage: '',
  description: `صفحه تخصصی برند قطعات ${item.nameFa}${item.nameEn ? ` (${item.nameEn})` : ''}؛ شامل محصولات موجود، دسته‌بندی‌های مرتبط، خودروهای سازگار و اطلاعات فنی ثبت‌شده در فروشگاه.`,
  bottomDescription: '',
  country: '',
  foundedYear: 0,
  websiteUrl: item.websiteUrl || '',
  group: item.group || '',
  specialties: [],
  certifications: [],
  popularCategorySlugs: [],
  faq: []
});

const run = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS part_brands (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(190) NOT NULL UNIQUE,
      name_fa VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NULL,
      data_json JSON NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_part_brands_active_name (is_active, name_fa)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_part_brands (
      product_id VARCHAR(64) NOT NULL,
      part_brand_id VARCHAR(64) NOT NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (product_id, part_brand_id),
      KEY idx_product_part_brands_brand (part_brand_id, is_primary, sort_order),
      CONSTRAINT fk_product_part_brands_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_product_part_brands_brand FOREIGN KEY (part_brand_id) REFERENCES part_brands(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  for (const item of PART_MANUFACTURERS) {
    const brand = defaultPartBrand(item);
    await pool.execute(
      `INSERT INTO part_brands (id, slug, name_fa, name_en, data_json, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         name_fa = VALUES(name_fa),
         name_en = VALUES(name_en),
         is_active = 1,
         data_json = CASE
           WHEN JSON_LENGTH(COALESCE(data_json, JSON_OBJECT())) <= 2 THEN VALUES(data_json)
           ELSE data_json
         END`,
      [brand.id, brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand)]
    );
  }

  const [brandRows] = await pool.query<Array<RowDataPacket & { id: string; name_fa: string; name_en: string | null; data_json: any }>>(
    'SELECT id, name_fa, name_en, data_json FROM part_brands'
  );
  const byName = new Map<string, string>();
  for (const row of brandRows) {
    const data = typeof row.data_json === 'object' ? row.data_json : JSON.parse(String(row.data_json || '{}'));
    for (const candidate of [row.name_fa, row.name_en, data?.nameFa, data?.nameEn]) {
      const key = normalizeName(candidate);
      if (key) byName.set(key, row.id);
    }
  }

  const [productRows] = await pool.query<Array<RowDataPacket & { id: string; data_json: any }>>(
    `SELECT id, data_json FROM products WHERE status <> 'deleted'`
  );

  let productUpdates = 0;
  let links = 0;
  for (const row of productRows) {
    const data = typeof row.data_json === 'object' ? { ...row.data_json } : JSON.parse(String(row.data_json || '{}'));
    let ids = Array.isArray(data.partBrandIds) ? data.partBrandIds.map(String).filter(Boolean) : [];
    const legacyNames = [data.partManufacturerCompany, data.brandManufacturer].map(normalizeName).filter(Boolean);
    if (!ids.length) {
      for (const name of legacyNames) {
        const knownId = byName.get(name);
        if (knownId) ids.push(knownId);
      }
    }
    ids = Array.from(new Set(ids));

    if (!ids.length && legacyNames[0]) {
      const display = String(data.partManufacturerCompany || data.brandManufacturer || '').trim();
      if (display) {
        const id = stableLegacyId(display);
        const slug = slugify(display) || id;
        const brand = {
          id,
          nameFa: display,
          nameEn: '',
          slug,
          logo: '',
          heroImage: '',
          description: `محصولات و اطلاعات ثبت‌شده برای برند قطعات ${display}.`,
          bottomDescription: '',
          country: '',
          foundedYear: 0,
          websiteUrl: '',
          group: '',
          specialties: [],
          certifications: [],
          popularCategorySlugs: [],
          faq: []
        };
        await pool.execute(
          `INSERT IGNORE INTO part_brands (id, slug, name_fa, name_en, data_json, is_active) VALUES (?, ?, ?, NULL, ?, 1)`,
          [id, slug, display, JSON.stringify(brand)]
        );
        ids = [id];
        byName.set(normalizeName(display), id);
      }
    }

    if (ids.length) {
      data.partBrandIds = ids;
      data.primaryPartBrandId = String(data.primaryPartBrandId || ids[0]);
      await pool.execute('UPDATE products SET data_json = ? WHERE id = ?', [JSON.stringify(data), row.id]);
      productUpdates += 1;
      await pool.execute('DELETE FROM product_part_brands WHERE product_id = ?', [row.id]);
      for (let index = 0; index < ids.length; index += 1) {
        const brandId = ids[index];
        await pool.execute(
          `INSERT IGNORE INTO product_part_brands (product_id, part_brand_id, is_primary, sort_order) VALUES (?, ?, ?, ?)`,
          [row.id, brandId, brandId === data.primaryPartBrandId ? 1 : 0, index]
        );
        links += 1;
      }
    }
  }

  console.log(`Part-brand migration ready: ${brandRows.length + PART_MANUFACTURERS.length} seed/known rows checked, ${productUpdates} products linked, ${links} relations.`);
};

run()
  .then(async () => { await pool.end(); })
  .catch(async error => {
    console.error('Part-brand migration failed:', error);
    await pool.end().catch(() => undefined);
    process.exit(1);
  });
