import 'dotenv/config';
import { pool, type RowDataPacket } from '../src/server/db';
import { PART_CATEGORIES } from '../src/data/partCategories';

interface ExistingCategory extends RowDataPacket {
  id: string;
  slug: string;
  data_json: unknown;
}

const TAXONOMY_VERSION = '2026-10-05-v1';

const parseJson = (value: unknown): Record<string, any> => {
  if (value && typeof value === 'object') return value as Record<string, any>;
  try { return JSON.parse(String(value || '{}')); } catch { return {}; }
};

const main = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [markerRows] = await connection.query<RowDataPacket[]>(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'part_category_taxonomy_version' LIMIT 1"
    );
    if (String(markerRows[0]?.setting_value || '') === TAXONOMY_VERSION) {
      await connection.commit();
      console.log('The 12-part category taxonomy is already installed.');
      return;
    }

    const [existingRows] = await connection.query<ExistingCategory[]>(
      'SELECT id, slug, data_json FROM categories'
    );
    const bySlug = new Map(existingRows.map(row => [row.slug, row]));

    for (const [sortOrder, category] of PART_CATEGORIES.entries()) {
      const previous = bySlug.get(category.slug);
      const oldData = parseJson(previous?.data_json);
      const merged = {
        ...oldData,
        ...category,
        id: previous?.id || category.id,
        icon: oldData.icon || category.icon,
        imageUrl: oldData.imageUrl || category.imageUrl,
        heroImage: oldData.heroImage || category.heroImage,
        parentId: null
      };

      await connection.execute(
        `INSERT INTO categories
          (id, slug, name_fa, name_en, parent_id, description, data_json, is_active, sort_order)
         VALUES (?, ?, ?, ?, NULL, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
          name_fa = VALUES(name_fa),
          name_en = VALUES(name_en),
          parent_id = NULL,
          description = VALUES(description),
          data_json = VALUES(data_json),
          is_active = 1,
          sort_order = VALUES(sort_order),
          updated_at = NOW()`,
        [
          merged.id,
          category.slug,
          category.nameFa,
          category.nameEn || null,
          category.description || null,
          JSON.stringify(merged),
          sortOrder
        ]
      );
    }

    // Reparent products from the former standalone categories while preserving
    // their searchable part data and making them visible under the new hierarchy.
    const reparent = async (from: string, to: string) => {
      await connection.execute(
        `UPDATE products
         SET category_slug = ?,
             data_json = JSON_SET(COALESCE(data_json, JSON_OBJECT()),
               '$.categorySlug', ?,
               '$.subcategorySlug', ?)
         WHERE category_slug = ?`,
        [to, to, from, from]
      );
    };
    await reparent('timing', 'engine');
    await reparent('turbo', 'fuel');
    // The existing filters root keeps its slug for compatibility; its label and tree are upgraded in place.

    await connection.execute(
      "UPDATE categories SET is_active = 0, updated_at = NOW() WHERE slug IN ('timing', 'turbo')"
    );
    await connection.execute(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES ('part_category_taxonomy_version', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [TAXONOMY_VERSION]
    );

    await connection.commit();
    console.log('Installed the 12-part category taxonomy and reparented legacy timing and turbo products; the filter slug remains compatible.');
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
