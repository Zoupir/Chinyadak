import 'dotenv/config';
import { pool } from '../src/server/db';
import {
  PRODUCTS,
  CATEGORIES,
  ARTICLES,
  INITIAL_ARTICLE_CATEGORIES,
  INITIAL_SLIDERS,
  INITIAL_PAGES,
  INITIAL_SETTINGS,
  INITIAL_PAYMENT_GATEWAYS,
  BRANDS,
  VEHICLE_MODELS
} from '../src/data/mockData';

const main = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const brand of BRANDS) {
      await connection.execute(
        `INSERT INTO vehicle_brands (id, slug, name_fa, name_en, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           name_fa = VALUES(name_fa),
           name_en = VALUES(name_en),
           data_json = VALUES(data_json),
           is_active = 1,
           updated_at = NOW()`,
        [brand.id, brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand)]
      );
    }

    for (const model of VEHICLE_MODELS) {
      await connection.execute(
        `INSERT INTO vehicle_models (id, brand_id, slug, name_fa, name_en, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           brand_id = VALUES(brand_id),
           slug = VALUES(slug),
           name_fa = VALUES(name_fa),
           name_en = VALUES(name_en),
           data_json = VALUES(data_json),
           is_active = 1,
           updated_at = NOW()`,
        [model.id, model.brandId, model.slug, model.nameFa, model.nameEn || null, JSON.stringify(model)]
      );
    }

    for (const category of CATEGORIES) {
      await connection.execute(
        `INSERT INTO categories
          (id, slug, name_fa, name_en, parent_id, description, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
          name_fa = VALUES(name_fa),
          name_en = VALUES(name_en),
          parent_id = VALUES(parent_id),
          description = VALUES(description),
          data_json = VALUES(data_json),
          is_active = 1,
          updated_at = NOW()`,
        [
          category.id,
          category.slug,
          category.nameFa,
          category.nameEn || null,
          category.parentId || null,
          category.description || null,
          JSON.stringify(category)
        ]
      );
    }

    for (const product of PRODUCTS) {
      await connection.execute(
        `INSERT INTO products
          (id, sku, slug, name_fa, name_en, oem_number, part_number, category_slug,
           manufacturer, grade, price, discount_price, stock, status, images_json,
           specs_json, fitments_json, data_json, short_description, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           sku = VALUES(sku),
           slug = VALUES(slug),
           name_fa = VALUES(name_fa),
           name_en = VALUES(name_en),
           oem_number = VALUES(oem_number),
           part_number = VALUES(part_number),
           category_slug = VALUES(category_slug),
           manufacturer = VALUES(manufacturer),
           grade = VALUES(grade),
           price = VALUES(price),
           discount_price = VALUES(discount_price),
           stock = VALUES(stock),
           status = 'active',
           images_json = VALUES(images_json),
           specs_json = VALUES(specs_json),
           fitments_json = VALUES(fitments_json),
           data_json = VALUES(data_json),
           short_description = VALUES(short_description),
           description = VALUES(description),
           updated_at = NOW()`,
        [
          product.id,
          product.sku,
          product.slug,
          product.nameFa,
          product.nameEn || null,
          product.oemNumber || null,
          product.partNumber || null,
          product.categorySlug,
          product.brandManufacturer || null,
          product.grade || null,
          product.price,
          product.discountPrice ?? null,
          product.stock,
          JSON.stringify(product.images || []),
          JSON.stringify(product.technicalSpecs || {}),
          JSON.stringify(product.fitments || []),
          JSON.stringify(product),
          product.shortDescription || null,
          product.description || null
        ]
      );
    }

    for (const category of INITIAL_ARTICLE_CATEGORIES) {
      await connection.execute(
        `INSERT INTO article_categories (id, slug, name, data_json)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           name = VALUES(name),
           data_json = VALUES(data_json),
           updated_at = NOW()`,
        [category.id, category.slug, category.name, JSON.stringify(category)]
      );
    }

    for (const article of ARTICLES) {
      await connection.execute(
        `INSERT INTO articles (id, slug, title, category_id, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           title = VALUES(title),
           category_id = VALUES(category_id),
           data_json = VALUES(data_json),
           is_active = 1,
           updated_at = NOW()`,
        [article.id, article.slug, article.title, article.categoryId || null, JSON.stringify(article)]
      );
    }

    for (const slider of INITIAL_SLIDERS) {
      await connection.execute(
        `INSERT INTO sliders (id, sort_order, is_active, data_json)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active),
           data_json = VALUES(data_json),
           updated_at = NOW()`,
        [slider.id, slider.order || 0, slider.isActive === false ? 0 : 1, JSON.stringify(slider)]
      );
    }

    for (const page of INITIAL_PAGES) {
      await connection.execute(
        `INSERT INTO site_pages (id, slug, title, is_system, data_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           title = VALUES(title),
           is_system = VALUES(is_system),
           data_json = VALUES(data_json),
           updated_at = NOW()`,
        [page.id, page.slug, page.title, page.isSystem ? 1 : 0, JSON.stringify(page)]
      );
    }

    const safeGateways = INITIAL_PAYMENT_GATEWAYS.map(gateway => ({
      ...gateway,
      merchantId: '',
      terminalId: ''
    }));

    await connection.execute(
      `INSERT IGNORE INTO app_settings (setting_key, setting_value)
       VALUES ('site_settings', ?)`,
      [JSON.stringify(INITIAL_SETTINGS)]
    );
    await connection.execute(
      `INSERT IGNORE INTO app_settings (setting_key, setting_value)
       VALUES ('payment_gateways', ?)`,
      [JSON.stringify(safeGateways)]
    );

    await connection.commit();
    console.log(`Seeded catalog and CMS content into MySQL.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
