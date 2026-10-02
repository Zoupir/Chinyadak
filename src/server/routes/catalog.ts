import { randomUUID } from 'crypto';
import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { pool, type ResultSetHeader, type RowDataPacket } from '../db';

interface ProductRow extends RowDataPacket {
  id: string;
  sku?: string;
  slug?: string;
  name_fa?: string;
  name_en?: string | null;
  oem_number?: string | null;
  part_number?: string | null;
  category_slug?: string;
  manufacturer?: string | null;
  grade?: string | null;
  price?: number | string;
  discount_price?: number | string | null;
  stock: number;
  reserved_stock: number;
  short_description?: string | null;
  description?: string | null;
  data_json: any;
}

const PRODUCT_PUBLIC_COLUMNS = [
  'id',
  'sku',
  'slug',
  'name_fa',
  'name_en',
  'oem_number',
  'part_number',
  'category_slug',
  'manufacturer',
  'grade',
  'price',
  'discount_price',
  'stock',
  'reserved_stock',
  'short_description',
  'description',
  'data_json'
].join(', ');

interface CategoryRow extends RowDataPacket {
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

const productDto = (row: ProductRow) => {
  const data = parseJson<any>(row.data_json, {});
  const availableStock = Math.max(0, Number(row.stock) - Number(row.reserved_stock || 0));
  return {
    ...data,
    // Indexed scalar columns are authoritative. data_json only carries extended fields.
    id: row.id,
    sku: row.sku ?? data.sku ?? '',
    slug: row.slug ?? data.slug ?? '',
    nameFa: row.name_fa ?? data.nameFa ?? '',
    nameEn: row.name_en ?? data.nameEn ?? '',
    oemNumber: row.oem_number ?? data.oemNumber ?? '',
    partNumber: row.part_number ?? data.partNumber ?? '',
    categorySlug: row.category_slug ?? data.categorySlug ?? '',
    brandManufacturer: row.manufacturer ?? data.brandManufacturer ?? '',
    grade: row.grade ?? data.grade ?? 'aftermarket',
    price: row.price == null ? Number(data.price || 0) : Number(row.price),
    discountPrice: row.discount_price == null ? undefined : Number(row.discount_price),
    shortDescription: row.short_description ?? data.shortDescription ?? '',
    description: row.description ?? data.description ?? '',
    stock: availableStock,
    stockStatus: availableStock <= 0 ? 'out_of_stock' : availableStock <= 3 ? 'low_stock' : 'in_stock'
  };
};

const normalizeProduct = (input: any) => {
  const product = { ...input };
  product.id = String(product.id || randomUUID());
  product.slug = String(product.slug || '').trim();
  product.sku = String(product.sku || '').trim();
  product.nameFa = String(product.nameFa || '').trim();
  product.nameEn = String(product.nameEn || '').trim();
  product.oemNumber = String(product.oemNumber || '').trim();
  product.partNumber = String(product.partNumber || '').trim();
  product.categorySlug = String(product.categorySlug || '').trim();
  product.brandManufacturer = String(product.brandManufacturer || '').trim();
  product.grade = String(product.grade || 'aftermarket');
  product.price = Math.max(0, Number(product.price || 0));
  product.discountPrice = product.discountPrice == null ? undefined : Math.max(0, Number(product.discountPrice));
  product.stock = Math.max(0, Math.floor(Number(product.stock || 0)));
  product.stockStatus = product.stock <= 0 ? 'out_of_stock' : product.stock <= 3 ? 'low_stock' : 'in_stock';
  product.images = Array.isArray(product.images) ? product.images : [];
  product.rating = Number(product.rating || 0);
  product.reviewsCount = Math.max(0, Math.floor(Number(product.reviewsCount || 0)));
  product.weightKg = Number(product.weightKg || 0);
  product.dimensionsCm = String(product.dimensionsCm || '');
  product.countryOfOrigin = String(product.countryOfOrigin || '');
  product.warrantyMonths = Math.max(0, Math.floor(Number(product.warrantyMonths || 0)));
  product.warrantyDescription = String(product.warrantyDescription || '');
  product.placement = String(product.placement || '');
  product.shortDescription = String(product.shortDescription || '');
  product.description = String(product.description || '');
  product.technicalSpecs = product.technicalSpecs && typeof product.technicalSpecs === 'object' ? product.technicalSpecs : {};
  product.symptomsOfFailure = Array.isArray(product.symptomsOfFailure) ? product.symptomsOfFailure : [];
  product.replacementInterval = String(product.replacementInterval || '');
  product.installationTips = Array.isArray(product.installationTips) ? product.installationTips : [];
  product.genuineVsFakeNotes = String(product.genuineVsFakeNotes || '');
  product.fitments = Array.isArray(product.fitments) ? product.fitments : [];
  product.vehicleModelIds = Array.isArray(product.vehicleModelIds) ? product.vehicleModelIds : [];
  product.vehicleBrandIds = Array.isArray(product.vehicleBrandIds) ? product.vehicleBrandIds : [];
  product.complementPartIds = Array.isArray(product.complementPartIds) ? product.complementPartIds : [];
  product.relatedPartIds = Array.isArray(product.relatedPartIds) ? product.relatedPartIds : [];
  return product;
};

const validateProduct = (product: any): string | null => {
  if (!product.slug) return 'PRODUCT_SLUG_REQUIRED';
  if (!product.sku) return 'PRODUCT_SKU_REQUIRED';
  if (!product.nameFa) return 'PRODUCT_NAME_REQUIRED';
  if (!product.categorySlug) return 'PRODUCT_CATEGORY_REQUIRED';
  if (!Number.isFinite(product.price)) return 'PRODUCT_PRICE_INVALID';
  return null;
};

const normalizeCategory = (input: any) => ({
  ...input,
  id: String(input?.id || randomUUID()),
  nameFa: String(input?.nameFa || '').trim(),
  nameEn: String(input?.nameEn || '').trim(),
  slug: String(input?.slug || '').trim(),
  icon: String(input?.icon || 'Package'),
  iconUrl: input?.iconUrl ? String(input.iconUrl) : undefined,
  imageUrl: input?.imageUrl ? String(input.imageUrl) : undefined,
  description: String(input?.description || ''),
  parentId: input?.parentId ? String(input.parentId) : undefined,
  subcategories: Array.isArray(input?.subcategories) ? input.subcategories : []
});

const activeCategoryExists = async (slug: string): Promise<boolean> => {
  const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    'SELECT id FROM categories WHERE slug = ? AND is_active = 1 LIMIT 1',
    [slug]
  );
  return Boolean(rows[0]);
};

const validateCategoryParent = async (
  categoryId: string,
  parentId?: string
): Promise<string | null> => {
  if (!parentId) return null;
  if (parentId === categoryId) return 'CATEGORY_PARENT_SELF';

  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string;
    parent_id: string | null;
    is_active: number;
  }>>('SELECT id, parent_id, is_active FROM categories');

  const byId = new Map(rows.map(row => [row.id, row]));
  const parent = byId.get(parentId);
  if (!parent || !parent.is_active) return 'CATEGORY_PARENT_NOT_FOUND';

  let current: string | null = parentId;
  const visited = new Set<string>();
  while (current) {
    if (current === categoryId) return 'CATEGORY_PARENT_CYCLE';
    if (visited.has(current)) return 'CATEGORY_PARENT_CYCLE';
    visited.add(current);
    current = byId.get(current)?.parent_id || null;
  }
  return null;
};

export const catalogRouter = Router();

catalogRouter.get('/products', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 120);
  const category = String(req.query.category || '').trim().slice(0, 190);
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(req.query.limit || 120))));
  const offset = (page - 1) * limit;

  const params: unknown[] = [];
  const clauses = ["status = 'active'"];

  if (category) {
    clauses.push('category_slug = ?');
    params.push(category);
  }

  if (q) {
    const prefix = `${q}%`;
    const fulltextQuery = q
      .split(/\s+/)
      .map(token => token.replace(/[^\p{L}\p{N}_-]+/gu, ''))
      .filter(token => token.length >= 2)
      .map(token => `+${token}*`)
      .join(' ');

    if (fulltextQuery) {
      clauses.push(`(
        sku = ?
        OR oem_number = ?
        OR part_number = ?
        OR sku LIKE ?
        OR oem_number LIKE ?
        OR part_number LIKE ?
        OR MATCH(name_fa, name_en, oem_number, part_number)
           AGAINST (? IN BOOLEAN MODE)
      )`);
      params.push(q, q, q, prefix, prefix, prefix, fulltextQuery);
    } else {
      clauses.push('(sku LIKE ? OR oem_number LIKE ? OR part_number LIKE ? OR name_fa LIKE ? OR name_en LIKE ?)');
      params.push(prefix, prefix, prefix, prefix, prefix);
    }
  }

  const where = clauses.join(' AND ');
  const [countRows] = await pool.query<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM products WHERE ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query<ProductRow[]>(
    `SELECT ${PRODUCT_PUBLIC_COLUMNS}
     FROM products
     WHERE ${where}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    products: rows.map(productDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + rows.length < total
    }
  });
});

catalogRouter.get('/products/:idOrSlug', async (req, res) => {
  const key = String(req.params.idOrSlug || '');
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT ${PRODUCT_PUBLIC_COLUMNS} FROM products WHERE status = 'active' AND (id = ? OR slug = ?) LIMIT 1`,
    [key, key]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    return;
  }
  res.json({ product: productDto(rows[0]) });
});

catalogRouter.post('/products', requireAdminPermission('canManageProducts'), async (req, res) => {
  const product = normalizeProduct(req.body);
  const invalid = validateProduct(product);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }
  if (!(await activeCategoryExists(product.categorySlug))) {
    res.status(400).json({ error: 'PRODUCT_CATEGORY_NOT_FOUND' });
    return;
  }

  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO products
        (id, sku, slug, name_fa, name_en, oem_number, part_number, category_slug, manufacturer, grade,
         price, discount_price, stock, status, images_json, specs_json, fitments_json, data_json,
         short_description, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
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
        JSON.stringify(product.images),
        JSON.stringify(product.technicalSpecs),
        JSON.stringify(product.fitments),
        JSON.stringify(product),
        product.shortDescription || null,
        product.description || null
      ]
    );
    res.status(201).json({ product });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PRODUCT_DUPLICATE_SKU_OR_SLUG' });
      return;
    }
    throw error;
  }
});

catalogRouter.put('/products/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const product = normalizeProduct({ ...req.body, id: req.params.id });
  const invalid = validateProduct(product);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }
  if (!(await activeCategoryExists(product.categorySlug))) {
    res.status(400).json({ error: 'PRODUCT_CATEGORY_NOT_FOUND' });
    return;
  }

  try {
    const [currentRows] = await pool.query<ProductRow[]>(
      'SELECT id, stock, reserved_stock, data_json FROM products WHERE id = ? LIMIT 1',
      [product.id]
    );
    const current = currentRows[0];
    if (!current) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    if (product.stock < Number(current.reserved_stock || 0)) {
      res.status(409).json({
        error: 'STOCK_BELOW_ACTIVE_RESERVATIONS',
        reserved: Number(current.reserved_stock || 0)
      });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE products SET
        sku = ?, slug = ?, name_fa = ?, name_en = ?, oem_number = ?, part_number = ?,
        category_slug = ?, manufacturer = ?, grade = ?, price = ?, discount_price = ?, stock = ?,
        images_json = ?, specs_json = ?, fitments_json = ?, data_json = ?,
        short_description = ?, description = ?, updated_at = NOW()
       WHERE id = ?`,
      [
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
        JSON.stringify(product.images),
        JSON.stringify(product.technicalSpecs),
        JSON.stringify(product.fitments),
        JSON.stringify(product),
        product.shortDescription || null,
        product.description || null,
        product.id
      ]
    );
    if (!result.affectedRows) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    res.json({ product });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PRODUCT_DUPLICATE_SKU_OR_SLUG' });
      return;
    }
    throw error;
  }
});

catalogRouter.patch('/products/bulk', requireAdminPermission('canManageProducts'), async (req, res) => {
  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (!updates.length || updates.length > 500) {
    res.status(400).json({ error: 'INVALID_BULK_UPDATE' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const update of updates) {
      const id = String(update.id || '');
      if (!id) continue;
      const [rows] = await connection.query<ProductRow[]>(
        'SELECT id, stock, reserved_stock, data_json FROM products WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!rows[0]) continue;
      const product = normalizeProduct({
        ...parseJson<any>(rows[0].data_json, {}),
        ...(update.price !== undefined ? { price: update.price } : {}),
        ...(update.stock !== undefined ? { stock: update.stock } : {})
      });
      if (product.stock < Number(rows[0].reserved_stock || 0)) {
        throw new Error('STOCK_BELOW_ACTIVE_RESERVATIONS');
      }
      await connection.execute(
        `UPDATE products
         SET price = ?, stock = ?, data_json = ?, updated_at = NOW()
         WHERE id = ?`,
        [product.price, product.stock, JSON.stringify(product), id]
      );
    }
    await connection.commit();
    res.json({ ok: true, updated: updates.length });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

catalogRouter.delete('/products/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = ?",
    [req.params.id]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    return;
  }
  res.json({ ok: true });
});

catalogRouter.get('/categories', async (_req, res) => {
  const [rows] = await pool.query<CategoryRow[]>(
    'SELECT id, data_json FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name_fa ASC'
  );
  res.json({
    categories: rows.map(row => {
      const data = parseJson<any>(row.data_json, {});
      return { ...data, id: row.id };
    })
  });
});

catalogRouter.post('/categories', requireAdminPermission('canManageProducts'), async (req, res) => {
  const category = normalizeCategory(req.body);
  if (!category.slug || !category.nameFa || category.slug.length > 190 || category.nameFa.length > 255) {
    res.status(400).json({ error: 'CATEGORY_DATA_INVALID' });
    return;
  }
  const parentError = await validateCategoryParent(category.id, category.parentId);
  if (parentError) {
    res.status(400).json({ error: parentError });
    return;
  }
  try {
    await pool.execute(
      `INSERT INTO categories
       (id, slug, name_fa, name_en, parent_id, description, data_json, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
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
    res.status(201).json({ category });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'CATEGORY_SLUG_EXISTS' });
      return;
    }
    throw error;
  }
});

catalogRouter.put('/categories/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const category = normalizeCategory({ ...req.body, id: req.params.id });
  if (!category.slug || !category.nameFa || category.slug.length > 190 || category.nameFa.length > 255) {
    res.status(400).json({ error: 'CATEGORY_DATA_INVALID' });
    return;
  }
  const parentError = await validateCategoryParent(category.id, category.parentId);
  if (parentError) {
    res.status(400).json({ error: parentError });
    return;
  }
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE categories SET
      slug = ?, name_fa = ?, name_en = ?, parent_id = ?, description = ?, data_json = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      category.slug,
      category.nameFa,
      category.nameEn || null,
      category.parentId || null,
      category.description || null,
      JSON.stringify(category),
      category.id
    ]
  );
  if (!result.affectedRows) {
    res.status(404).json({ error: 'CATEGORY_NOT_FOUND' });
    return;
  }
  res.json({ category });
});

catalogRouter.delete('/categories/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const [categoryRows] = await pool.query<Array<RowDataPacket & { slug: string }>>(
    'SELECT slug FROM categories WHERE id = ? AND is_active = 1 LIMIT 1',
    [req.params.id]
  );
  const category = categoryRows[0];
  if (!category) {
    res.status(404).json({ error: 'CATEGORY_NOT_FOUND' });
    return;
  }

  const [[usage], [children]] = await Promise.all([
    pool.query<Array<RowDataPacket & { count: number }>>(
      "SELECT COUNT(*) AS count FROM products WHERE category_slug = ? AND status = 'active'",
      [category.slug]
    ),
    pool.query<Array<RowDataPacket & { count: number }>>(
      'SELECT COUNT(*) AS count FROM categories WHERE parent_id = ? AND is_active = 1',
      [req.params.id]
    )
  ]);

  if (Number(usage[0]?.count || 0) > 0) {
    res.status(409).json({ error: 'CATEGORY_IN_USE_BY_PRODUCTS' });
    return;
  }
  if (Number(children[0]?.count || 0) > 0) {
    res.status(409).json({ error: 'CATEGORY_HAS_ACTIVE_CHILDREN' });
    return;
  }

  await pool.execute(
    'UPDATE categories SET is_active = 0, updated_at = NOW() WHERE id = ?',
    [req.params.id]
  );
  res.json({ ok: true });
});
