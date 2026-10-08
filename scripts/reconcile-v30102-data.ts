import { pool, type RowDataPacket } from '../src/server/db';
import {
  PRODUCT_CANONICAL_COLUMNS,
  canonicalCategoryDto,
  canonicalProductDto,
  loadCatalogReferenceIndex,
  parseStoredJson,
  type CanonicalBrandRow,
  type CanonicalCategoryRow,
  type CanonicalModelRow,
  type CanonicalProductRow
} from '../src/server/data-integrity';

const stableJson = (value: unknown) => JSON.stringify(value ?? null);

const run = async () => {
  let brandsReconciled = 0;
  let modelsReconciled = 0;
  let categoriesReconciled = 0;
  let productsReconciled = 0;

  const [brandRows] = await pool.query<CanonicalBrandRow[]>(
    'SELECT id, slug, name_fa, name_en, data_json, is_active FROM vehicle_brands'
  );
  for (const row of brandRows) {
    const current = parseStoredJson<Record<string, any>>(row.data_json, {});
    const next = {
      ...current,
      id: row.id,
      slug: row.slug,
      nameFa: row.name_fa,
      nameEn: row.name_en || ''
    };
    if (stableJson(current) !== stableJson(next)) {
      await pool.execute('UPDATE vehicle_brands SET data_json = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(next), row.id]);
      brandsReconciled += 1;
    }
  }

  const [modelRows] = await pool.query<CanonicalModelRow[]>(
    'SELECT id, brand_id, slug, name_fa, name_en, data_json, is_active FROM vehicle_models'
  );
  for (const row of modelRows) {
    const current = parseStoredJson<Record<string, any>>(row.data_json, {});
    const next = {
      ...current,
      id: row.id,
      brandId: row.brand_id,
      slug: row.slug,
      nameFa: row.name_fa,
      nameEn: row.name_en || ''
    };
    if (stableJson(current) !== stableJson(next)) {
      await pool.execute('UPDATE vehicle_models SET data_json = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(next), row.id]);
      modelsReconciled += 1;
    }
  }

  const [categoryRows] = await pool.query<CanonicalCategoryRow[]>(
    `SELECT id, slug, name_fa, name_en, parent_id, description, data_json, is_active, sort_order
     FROM categories`
  );
  for (const row of categoryRows) {
    const current = parseStoredJson<Record<string, any>>(row.data_json, {});
    const canonical = canonicalCategoryDto(row);
    if (stableJson(current) !== stableJson(canonical)) {
      await pool.execute('UPDATE categories SET data_json = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(canonical), row.id]);
      categoriesReconciled += 1;
    }
  }

  const refs = await loadCatalogReferenceIndex(pool);
  const [productRows] = await pool.query<CanonicalProductRow[]>(
    `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products`
  );
  for (const row of productRows) {
    const current = parseStoredJson<Record<string, any>>(row.data_json, {});
    const canonical = canonicalProductDto(row);
    const rawFitments = Array.isArray(canonical.fitments) ? canonical.fitments : [];
    const fitments = rawFitments.map((fitment: any) => {
      const model = refs.modelsById.get(String(fitment?.modelId || ''));
      if (!model) return fitment;
      const brand = refs.brandsById.get(model.brandId);
      if (!brand) return fitment;
      return { ...fitment, modelId: model.id, modelName: model.nameFa, brandId: brand.id, brandName: brand.nameFa };
    });
    const physicalStock = Math.max(0, Number(row.stock || 0));
    const availableStock = Math.max(0, physicalStock - Math.max(0, Number(row.reserved_stock || 0)));
    const next = {
      ...current,
      ...canonical,
      stock: physicalStock,
      stockStatus: availableStock <= 0 ? 'out_of_stock' : availableStock <= 3 ? 'low_stock' : 'in_stock',
      fitments
    };
    if (stableJson(current) !== stableJson(next) || stableJson(rawFitments) !== stableJson(fitments)) {
      await pool.execute(
        'UPDATE products SET data_json = ?, fitments_json = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(next), JSON.stringify(fitments), row.id]
      );
      productsReconciled += 1;
    }
  }

  const [orphanModels] = await pool.query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total
     FROM vehicle_models m
     LEFT JOIN vehicle_brands b ON b.id = m.brand_id AND b.is_active = 1
     WHERE m.is_active = 1 AND b.id IS NULL`
  );
  const [orphanCategoryParents] = await pool.query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total
     FROM categories c
     LEFT JOIN categories p ON p.id = c.parent_id AND p.is_active = 1
     WHERE c.is_active = 1 AND c.parent_id IS NOT NULL AND p.id IS NULL`
  );

  console.log(
    `v30.10.2 data reconciliation: ${brandsReconciled} brands, ${modelsReconciled} models, ` +
    `${categoriesReconciled} categories, ${productsReconciled} products synchronized. ` +
    `Unresolved structural issues: ${Number(orphanModels[0]?.total || 0)} orphan models, ` +
    `${Number(orphanCategoryParents[0]?.total || 0)} orphan category parents.`
  );
};

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
