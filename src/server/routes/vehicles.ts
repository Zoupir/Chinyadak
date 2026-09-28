import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { pool, type ResultSetHeader, type RowDataPacket } from '../db';

interface VehicleRow extends RowDataPacket {
  id: string;
  data_json: any;
}

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

export const vehiclesRouter = Router();

vehiclesRouter.get('/', async (_req, res) => {
  const [[brands], [models]] = await Promise.all([
    pool.query<VehicleRow[]>(
      'SELECT id, data_json FROM vehicle_brands WHERE is_active = 1 ORDER BY name_fa ASC'
    ),
    pool.query<VehicleRow[]>(
      'SELECT id, data_json FROM vehicle_models WHERE is_active = 1 ORDER BY name_fa ASC'
    )
  ]);

  res.json({
    brands: brands.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id })),
    models: models.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id }))
  });
});

vehiclesRouter.post('/brands', requireAdminPermission('canManageVehicles'), async (req, res) => {
  const brand = { ...req.body };
  brand.id = String(brand.id || '').trim();
  brand.slug = String(brand.slug || '').trim();
  brand.nameFa = String(brand.nameFa || '').trim();
  if (!brand.id || !brand.slug || !brand.nameFa) {
    res.status(400).json({ error: 'VEHICLE_BRAND_INVALID' });
    return;
  }

  try {
    await pool.execute(
      `INSERT INTO vehicle_brands (id, slug, name_fa, name_en, data_json, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [brand.id, brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand)]
    );
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'VEHICLE_BRAND_EXISTS' });
      return;
    }
    throw error;
  }

  res.status(201).json({ brand });
});

vehiclesRouter.put('/brands/:id', requireAdminPermission('canManageVehicles'), async (req, res) => {
  const brand = { ...req.body, id: String(req.params.id) };
  brand.slug = String(brand.slug || '').trim();
  brand.nameFa = String(brand.nameFa || '').trim();
  if (!brand.slug || !brand.nameFa) {
    res.status(400).json({ error: 'VEHICLE_BRAND_INVALID' });
    return;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE vehicle_brands
     SET slug = ?, name_fa = ?, name_en = ?, data_json = ?, is_active = 1, updated_at = NOW()
     WHERE id = ?`,
    [brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand), brand.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'VEHICLE_BRAND_NOT_FOUND' });
    return;
  }
  res.json({ brand });
});

vehiclesRouter.delete('/brands/:id', requireAdminPermission('canManageVehicles'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE vehicle_brands SET is_active = 0, updated_at = NOW() WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'VEHICLE_BRAND_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

vehiclesRouter.post('/models', requireAdminPermission('canManageVehicles'), async (req, res) => {
  const model = { ...req.body };
  model.id = String(model.id || '').trim();
  model.brandId = String(model.brandId || '').trim();
  model.slug = String(model.slug || '').trim();
  model.nameFa = String(model.nameFa || '').trim();
  if (!model.id || !model.brandId || !model.slug || !model.nameFa) {
    res.status(400).json({ error: 'VEHICLE_MODEL_INVALID' });
    return;
  }

  try {
    await pool.execute(
      `INSERT INTO vehicle_models (id, brand_id, slug, name_fa, name_en, data_json, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [model.id, model.brandId, model.slug, model.nameFa, model.nameEn || null, JSON.stringify(model)]
    );
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'VEHICLE_MODEL_EXISTS' });
      return;
    }
    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(409).json({ error: 'VEHICLE_BRAND_NOT_FOUND' });
      return;
    }
    throw error;
  }

  res.status(201).json({ model });
});

vehiclesRouter.put('/models/:id', requireAdminPermission('canManageVehicles'), async (req, res) => {
  const model = { ...req.body, id: String(req.params.id) };
  model.brandId = String(model.brandId || '').trim();
  model.slug = String(model.slug || '').trim();
  model.nameFa = String(model.nameFa || '').trim();
  if (!model.brandId || !model.slug || !model.nameFa) {
    res.status(400).json({ error: 'VEHICLE_MODEL_INVALID' });
    return;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE vehicle_models
     SET brand_id = ?, slug = ?, name_fa = ?, name_en = ?, data_json = ?, is_active = 1, updated_at = NOW()
     WHERE id = ?`,
    [model.brandId, model.slug, model.nameFa, model.nameEn || null, JSON.stringify(model), model.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'VEHICLE_MODEL_NOT_FOUND' });
    return;
  }
  res.json({ model });
});

vehiclesRouter.delete('/models/:id', requireAdminPermission('canManageVehicles'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE vehicle_models SET is_active = 0, updated_at = NOW() WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'VEHICLE_MODEL_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});
