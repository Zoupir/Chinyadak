import { Router, type Request, type Response } from 'express';
import { requireAdminPermission } from '../auth';
import { pool, withTransaction, type ResultSetHeader, type RowDataPacket } from '../db';
import {
  canonicalBrandDto,
  canonicalModelDto,
  collectProductReferenceUsage,
  type CanonicalBrandRow,
  type CanonicalModelRow
} from '../data-integrity';

const normalizeBrand = (input: any, forcedId?: string) => {
  const brand = { ...input };
  brand.id = String(forcedId || brand.id || '').trim();
  brand.slug = String(brand.slug || '').trim();
  brand.nameFa = String(brand.nameFa || '').trim();
  brand.nameEn = String(brand.nameEn || '').trim();
  brand.logo = String(brand.logo || '');
  brand.heroImage = String(brand.heroImage || '');
  brand.description = String(brand.description || '');
  brand.country = String(brand.country || '');
  brand.foundedYear = Math.max(0, Math.floor(Number(brand.foundedYear || 0)));
  brand.faq = Array.isArray(brand.faq) ? brand.faq : [];
  return brand;
};

const normalizeModel = (input: any, forcedId?: string) => {
  const model = { ...input };
  model.id = String(forcedId || model.id || '').trim();
  model.brandId = String(model.brandId || '').trim();
  model.slug = String(model.slug || '').trim();
  model.nameFa = String(model.nameFa || '').trim();
  model.nameEn = String(model.nameEn || '').trim();
  model.imageUrl = String(model.imageUrl || '');
  model.yearFrom = Math.max(0, Math.floor(Number(model.yearFrom || 0)));
  model.yearTo = Math.max(0, Math.floor(Number(model.yearTo || 0)));
  model.engineSummary = String(model.engineSummary || '');
  model.transmissionSummary = String(model.transmissionSummary || '');
  model.description = String(model.description || '');
  model.specifications = model.specifications && typeof model.specifications === 'object' ? model.specifications : {};
  model.commonIssues = Array.isArray(model.commonIssues) ? model.commonIssues : [];
  model.maintenanceTips = Array.isArray(model.maintenanceTips) ? model.maintenanceTips : [];
  model.faq = Array.isArray(model.faq) ? model.faq : [];
  return model;
};

const ensureActiveBrand = async (brandId: string, tx = pool): Promise<boolean> => {
  const [rows] = await tx.query<Array<RowDataPacket & { id: string }>>(
    'SELECT id FROM vehicle_brands WHERE id = ? AND is_active = 1 LIMIT 1',
    [brandId]
  );
  return Boolean(rows[0]);
};

export const vehiclesRouter = Router();

vehiclesRouter.get('/', async (_req: Request, res: Response) => {
  const [[brands], [models]] = await Promise.all([
    pool.query<CanonicalBrandRow[]>(
      `SELECT id, slug, name_fa, name_en, data_json, is_active
       FROM vehicle_brands
       WHERE is_active = 1
       ORDER BY name_fa ASC`
    ),
    pool.query<CanonicalModelRow[]>(
      `SELECT m.id, m.brand_id, m.slug, m.name_fa, m.name_en, m.data_json, m.is_active
       FROM vehicle_models m
       INNER JOIN vehicle_brands b ON b.id = m.brand_id AND b.is_active = 1
       WHERE m.is_active = 1
       ORDER BY m.name_fa ASC`
    )
  ]);

  res.json({
    brands: brands.map(canonicalBrandDto),
    models: models.map(canonicalModelDto)
  });
});

vehiclesRouter.post('/brands', requireAdminPermission('canManageVehicles'), async (req: Request, res: Response) => {
  const brand = normalizeBrand(req.body);
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

vehiclesRouter.put('/brands/:id', requireAdminPermission('canManageVehicles'), async (req: Request, res: Response) => {
  const brand = normalizeBrand(req.body, String(req.params.id));
  if (!brand.slug || !brand.nameFa) {
    res.status(400).json({ error: 'VEHICLE_BRAND_INVALID' });
    return;
  }

  try {
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
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'VEHICLE_BRAND_EXISTS' });
      return;
    }
    throw error;
  }

  res.json({ brand });
});

vehiclesRouter.delete('/brands/:id', requireAdminPermission('canManageVehicles'), async (req: Request, res: Response) => {
  const brandId = String(req.params.id || '');
  const result = await withTransaction(async tx => {
    const [brands] = await tx.query<Array<RowDataPacket & { id: string }>>(
      'SELECT id FROM vehicle_brands WHERE id = ? AND is_active = 1 FOR UPDATE',
      [brandId]
    );
    if (!brands[0]) return { missing: true, deactivatedModels: 0 };

    const [models] = await tx.query<Array<RowDataPacket & { id: string }>>(
      'SELECT id FROM vehicle_models WHERE brand_id = ? AND is_active = 1 FOR UPDATE',
      [brandId]
    );
    const usage = await collectProductReferenceUsage(tx);
    const productIds = new Set<string>(usage.brandIds.get(brandId) || []);
    for (const model of models) {
      for (const productId of usage.modelIds.get(model.id) || []) productIds.add(productId);
    }
    if (productIds.size) {
      return { inUse: true, productIds: Array.from(productIds).slice(0, 20), deactivatedModels: 0 };
    }

    await tx.execute('UPDATE vehicle_models SET is_active = 0, updated_at = NOW() WHERE brand_id = ?', [brandId]);
    await tx.execute('UPDATE vehicle_brands SET is_active = 0, updated_at = NOW() WHERE id = ?', [brandId]);
    return { missing: false, inUse: false, deactivatedModels: models.length };
  });

  if ('missing' in result && result.missing) {
    res.status(404).json({ error: 'VEHICLE_BRAND_NOT_FOUND' });
    return;
  }
  if ('inUse' in result && result.inUse) {
    res.status(409).json({ error: 'VEHICLE_BRAND_IN_USE', productIds: result.productIds });
    return;
  }
  res.json({ ok: true, deactivatedModels: result.deactivatedModels });
});

vehiclesRouter.post('/models', requireAdminPermission('canManageVehicles'), async (req: Request, res: Response) => {
  const model = normalizeModel(req.body);
  if (!model.id || !model.brandId || !model.slug || !model.nameFa) {
    res.status(400).json({ error: 'VEHICLE_MODEL_INVALID' });
    return;
  }
  if (!(await ensureActiveBrand(model.brandId))) {
    res.status(409).json({ error: 'VEHICLE_BRAND_NOT_FOUND' });
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

vehiclesRouter.put('/models/:id', requireAdminPermission('canManageVehicles'), async (req: Request, res: Response) => {
  const model = normalizeModel(req.body, String(req.params.id));
  if (!model.brandId || !model.slug || !model.nameFa) {
    res.status(400).json({ error: 'VEHICLE_MODEL_INVALID' });
    return;
  }

  try {
    const outcome = await withTransaction(async tx => {
      const [currentRows] = await tx.query<Array<RowDataPacket & { id: string; brand_id: string }>>(
        'SELECT id, brand_id FROM vehicle_models WHERE id = ? FOR UPDATE',
        [model.id]
      );
      const current = currentRows[0];
      if (!current) return 'missing' as const;
      if (!(await ensureActiveBrand(model.brandId, tx))) return 'brand-missing' as const;

      if (current.brand_id !== model.brandId) {
        const usage = await collectProductReferenceUsage(tx);
        if ((usage.modelIds.get(model.id)?.size || 0) > 0) return 'brand-change-in-use' as const;
      }

      await tx.execute(
        `UPDATE vehicle_models
         SET brand_id = ?, slug = ?, name_fa = ?, name_en = ?, data_json = ?, is_active = 1, updated_at = NOW()
         WHERE id = ?`,
        [model.brandId, model.slug, model.nameFa, model.nameEn || null, JSON.stringify(model), model.id]
      );
      return 'ok' as const;
    });

    if (outcome === 'missing') {
      res.status(404).json({ error: 'VEHICLE_MODEL_NOT_FOUND' });
      return;
    }
    if (outcome === 'brand-missing') {
      res.status(409).json({ error: 'VEHICLE_BRAND_NOT_FOUND' });
      return;
    }
    if (outcome === 'brand-change-in-use') {
      res.status(409).json({ error: 'VEHICLE_MODEL_BRAND_CHANGE_IN_USE' });
      return;
    }
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'VEHICLE_MODEL_EXISTS' });
      return;
    }
    throw error;
  }

  res.json({ model });
});

vehiclesRouter.delete('/models/:id', requireAdminPermission('canManageVehicles'), async (req: Request, res: Response) => {
  const modelId = String(req.params.id || '');
  const result = await withTransaction(async tx => {
    const [rows] = await tx.query<Array<RowDataPacket & { id: string }>>(
      'SELECT id FROM vehicle_models WHERE id = ? AND is_active = 1 FOR UPDATE',
      [modelId]
    );
    if (!rows[0]) return 'missing' as const;
    const usage = await collectProductReferenceUsage(tx);
    if ((usage.modelIds.get(modelId)?.size || 0) > 0) return 'in-use' as const;
    await tx.execute('UPDATE vehicle_models SET is_active = 0, updated_at = NOW() WHERE id = ?', [modelId]);
    return 'ok' as const;
  });

  if (result === 'missing') {
    res.status(404).json({ error: 'VEHICLE_MODEL_NOT_FOUND' });
    return;
  }
  if (result === 'in-use') {
    res.status(409).json({ error: 'VEHICLE_MODEL_IN_USE' });
    return;
  }
  res.json({ ok: true });
});
