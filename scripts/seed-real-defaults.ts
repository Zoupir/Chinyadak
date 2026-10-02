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

    // Fill only empty L8 technical fields in an earlier untouched starter row.
    const l8Default = REAL_VEHICLE_MODELS.find(model => model.id === 'lucano-l8');
    if (l8Default) {
      const [storedRows] = await connection.execute<any[]>(
        'SELECT data_json FROM vehicle_models WHERE id = ? LIMIT 1',
        ['lucano-l8']
      );
      const rawData = storedRows[0]?.data_json;
      const storedModel = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (storedModel) {
        const previousSpecs = storedModel.specifications || {};
        const nextSpecs = { ...previousSpecs };
        let changed = false;
        for (const key of ['engineCode', 'displacement', 'horsepower', 'torque', 'transmission'] as const) {
          if (!nextSpecs[key] && l8Default.specifications[key]) {
            nextSpecs[key] = l8Default.specifications[key];
            changed = true;
          }
        }
        const patch: Record<string, unknown> = { ...storedModel, specifications: nextSpecs };
        if (!storedModel.engineSummary && l8Default.engineSummary) {
          patch.engineSummary = l8Default.engineSummary;
          changed = true;
        }
        if (!storedModel.transmissionSummary && l8Default.transmissionSummary) {
          patch.transmissionSummary = l8Default.transmissionSummary;
          changed = true;
        }
        if (changed) {
          await connection.execute(
            'UPDATE vehicle_models SET data_json = ?, updated_at = NOW() WHERE id = ?',
            [JSON.stringify(patch), 'lucano-l8']
          );
        }
      }
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
