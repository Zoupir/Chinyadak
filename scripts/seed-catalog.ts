import 'dotenv/config';
import { pool } from '../src/server/db';
import { PRODUCTS, CATEGORIES } from '../src/data/mockData';

const main = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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

    await connection.commit();
    console.log(`Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products.`);
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
