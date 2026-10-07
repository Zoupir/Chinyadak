import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { pool, type ResultSetHeader, type RowDataPacket } from '../db';

type PartBrandRow = RowDataPacket & { id: string; data_json: any };
type ProductRow = RowDataPacket & { id: string; stock: number; reserved_stock: number; data_json: any };

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
};

const normalizePartBrand = (input: any) => {
  const brand = { ...input };
  brand.id = String(brand.id || randomUUID()).trim();
  brand.nameFa = String(brand.nameFa || '').trim();
  brand.nameEn = String(brand.nameEn || '').trim();
  brand.slug = String(brand.slug || '').trim().toLowerCase().replace(/\s+/g, '-');
  brand.logo = String(brand.logo || '').trim();
  brand.heroImage = String(brand.heroImage || '').trim();
  brand.description = String(brand.description || '');
  brand.bottomDescription = String(brand.bottomDescription || '');
  brand.country = String(brand.country || '').trim();
  brand.foundedYear = Math.max(0, Math.floor(Number(brand.foundedYear || 0)));
  brand.websiteUrl = String(brand.websiteUrl || '').trim();
  brand.group = String(brand.group || '').trim();
  brand.specialties = Array.isArray(brand.specialties) ? brand.specialties.map(String).map((v: string) => v.trim()).filter(Boolean).slice(0, 100) : [];
  brand.certifications = Array.isArray(brand.certifications) ? brand.certifications.map(String).map((v: string) => v.trim()).filter(Boolean).slice(0, 100) : [];
  brand.popularCategorySlugs = Array.isArray(brand.popularCategorySlugs) ? brand.popularCategorySlugs.map(String).filter(Boolean).slice(0, 100) : [];
  brand.faq = Array.isArray(brand.faq) ? brand.faq.map((item: any) => ({ q: String(item?.q || '').trim(), a: String(item?.a || '').trim() })).filter((item: any) => item.q && item.a).slice(0, 50) : [];
  return brand;
};

const productDto = (row: ProductRow) => {
  const data = parseJson<any>(row.data_json, {});
  const availableStock = Math.max(0, Number(row.stock || 0) - Number(row.reserved_stock || 0));
  return { ...data, id: row.id, stock: availableStock, stockStatus: availableStock <= 0 ? 'out_of_stock' : availableStock <= 3 ? 'low_stock' : 'in_stock' };
};

export const partBrandsRouter = Router();

partBrandsRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query<PartBrandRow[]>(
    `SELECT id, data_json FROM part_brands WHERE is_active = 1 ORDER BY name_fa ASC`
  );
  const [counts] = await pool.query<Array<RowDataPacket & { part_brand_id: string; total: number }>>(
    `SELECT ppb.part_brand_id, COUNT(*) total
       FROM product_part_brands ppb
       JOIN products p ON p.id = ppb.product_id AND p.status = 'active'
      GROUP BY ppb.part_brand_id`
  );
  const countMap = new Map(counts.map(row => [String(row.part_brand_id), Number(row.total || 0)]));
  res.json({
    partBrands: rows.map(row => ({ ...parseJson<any>(row.data_json, {}), id: row.id, productsCount: countMap.get(row.id) || 0 }))
  });
});

partBrandsRouter.get('/:idOrSlug', async (req, res) => {
  const key = String(req.params.idOrSlug || '');
  const [rows] = await pool.query<PartBrandRow[]>(
    `SELECT id, data_json FROM part_brands WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1`,
    [key, key]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'PART_BRAND_NOT_FOUND' });
    return;
  }
  res.json({ partBrand: { ...parseJson<any>(rows[0].data_json, {}), id: rows[0].id } });
});

partBrandsRouter.get('/:idOrSlug/products', async (req, res) => {
  const key = String(req.params.idOrSlug || '');
  const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100)));
  const [brandRows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    `SELECT id FROM part_brands WHERE is_active = 1 AND (id = ? OR slug = ?) LIMIT 1`,
    [key, key]
  );
  const id = String(brandRows[0]?.id || '');
  if (!id) {
    res.status(404).json({ error: 'PART_BRAND_NOT_FOUND' });
    return;
  }
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT p.id, p.stock, p.reserved_stock, p.data_json
       FROM product_part_brands ppb
       JOIN products p ON p.id = ppb.product_id
      WHERE ppb.part_brand_id = ? AND p.status = 'active'
      ORDER BY ppb.is_primary DESC, p.updated_at DESC
      LIMIT ?`,
    [id, limit]
  );
  res.json({ products: rows.map(productDto), total: rows.length });
});

partBrandsRouter.post('/', requireAdminPermission('canManageProducts'), async (req, res) => {
  const brand = normalizePartBrand(req.body);
  if (!brand.nameFa || !brand.slug) {
    res.status(400).json({ error: 'PART_BRAND_INVALID' });
    return;
  }
  try {
    await pool.execute(
      `INSERT INTO part_brands (id, slug, name_fa, name_en, data_json, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
      [brand.id, brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand)]
    );
    res.status(201).json({ partBrand: brand });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PART_BRAND_EXISTS' });
      return;
    }
    throw error;
  }
});

partBrandsRouter.put('/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const brand = normalizePartBrand({ ...req.body, id: req.params.id });
  if (!brand.nameFa || !brand.slug) {
    res.status(400).json({ error: 'PART_BRAND_INVALID' });
    return;
  }
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE part_brands SET slug = ?, name_fa = ?, name_en = ?, data_json = ?, is_active = 1, updated_at = NOW() WHERE id = ?`,
      [brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand), brand.id]
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: 'PART_BRAND_NOT_FOUND' });
      return;
    }
    res.json({ partBrand: brand });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PART_BRAND_EXISTS' });
      return;
    }
    throw error;
  }
});

partBrandsRouter.delete('/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE part_brands SET is_active = 0, updated_at = NOW() WHERE id = ?`,
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'PART_BRAND_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});
