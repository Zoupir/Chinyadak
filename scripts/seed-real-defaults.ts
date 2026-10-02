import 'dotenv/config';
import { pool } from '../src/server/db';
import { PART_MANUFACTURERS, REAL_MODEL_IMAGE_OVERRIDES, REAL_VEHICLE_BRANDS, REAL_VEHICLE_MODELS } from '../src/data/realCatalogDefaults';

const main = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const brand of REAL_VEHICLE_BRANDS) {
      await connection.execute(
        `INSERT IGNORE INTO vehicle_brands (id, slug, name_fa, name_en, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [brand.id, brand.slug, brand.nameFa, brand.nameEn, JSON.stringify(brand)]
      );
    }

    for (const model of REAL_VEHICLE_MODELS) {
      await connection.execute(
        `INSERT IGNORE INTO vehicle_models (id, brand_id, slug, name_fa, name_en, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [model.id, model.brandId, model.slug, model.nameFa, model.nameEn, JSON.stringify(model)]
      );
    }

    // Upgrade only the known stock placeholders in the matching model records.
    for (const [modelId, imageUrl] of Object.entries(REAL_MODEL_IMAGE_OVERRIDES)) {
      await connection.execute(
        `UPDATE vehicle_models
         SET data_json = JSON_SET(data_json, '$.imageUrl', ?), updated_at = NOW()
         WHERE id = ?
           AND JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.imageUrl')) LIKE 'https://images.unsplash.com/%'`,
        [imageUrl, modelId]
      );
    }

    await connection.execute(
      `INSERT IGNORE INTO app_settings (setting_key, setting_value)
       VALUES ('part_manufacturers', ?)`,
      [JSON.stringify(PART_MANUFACTURERS)]
    );

    await connection.commit();
    console.log(`Added real default data: ${REAL_VEHICLE_BRANDS.length} vehicle brand, ${REAL_VEHICLE_MODELS.length} vehicle models, ${PART_MANUFACTURERS.length} part manufacturers.`);
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
