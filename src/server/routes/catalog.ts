import { randomUUID } from 'crypto';
import { Router } from 'express';
import { requireAdminPermission } from '../auth';
import { pool, withTransaction, type ResultSetHeader, type RowDataPacket } from '../db';
import {
  PRODUCT_CANONICAL_COLUMNS,
  canonicalCategoryDto,
  canonicalProductDto,
  canonicalizeFitmentsForRead,
  canonicalizeProductReferences,
  categorySubtreeSlugs,
  collectProductReferenceUsage,
  dataIntegrityErrorResponse,
  DataIntegrityError,
  loadCatalogReferenceIndex,
  parseStoredJson,
  validateEmbeddedCategoryTree,
  type CanonicalCategoryRow,
  type CanonicalProductRow,
  type DbExecutor
} from '../data-integrity';

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
  product.subcategorySlug = String(product.subcategorySlug || '').trim() || undefined;
  product.brandManufacturer = String(product.brandManufacturer || '').trim();
  product.vehicleManufacturerCompany = String(product.vehicleManufacturerCompany || '').trim();
  product.partManufacturerCompany = String(product.partManufacturerCompany || '').trim();
  product.grade = String(product.grade || 'aftermarket');
  product.labelIds = Array.from(new Set((Array.isArray(product.labelIds) ? product.labelIds : []).map(String).filter(Boolean)));
  product.price = Math.max(0, Number(product.price || 0));
  product.discountPrice = product.discountPrice == null ? undefined : Math.max(0, Number(product.discountPrice));
  product.discountMode = ['none', 'percent', 'fixed'].includes(product.discountMode) ? product.discountMode : 'none';
  product.discountValue = Math.max(0, Number(product.discountValue || 0));
  product.discountStartsAt = product.discountStartsAt ? String(product.discountStartsAt) : undefined;
  product.discountEndsAt = product.discountEndsAt ? String(product.discountEndsAt) : undefined;
  product.stock = Math.max(0, Math.floor(Number(product.stock || 0)));
  product.stockStatus = product.stock <= 0 ? 'out_of_stock' : product.stock <= 3 ? 'low_stock' : 'in_stock';
  product.images = Array.isArray(product.images) ? product.images.map(String).filter(Boolean) : [];
  product.rating = Math.max(0, Number(product.rating || 0));
  product.reviewsCount = Math.max(0, Math.floor(Number(product.reviewsCount || 0)));
  product.weightKg = Math.max(0, Number(product.weightKg || 0));
  product.dimensionsCm = String(product.dimensionsCm || '');
  product.countryOfOrigin = String(product.countryOfOrigin || '');
  product.warrantyMonths = Math.max(0, Math.floor(Number(product.warrantyMonths || 0)));
  product.warrantyDescription = String(product.warrantyDescription || '');
  product.placement = String(product.placement || '');
  product.shortDescription = String(product.shortDescription || '');
  product.description = String(product.description || '');
  product.technicalSpecs = product.technicalSpecs && typeof product.technicalSpecs === 'object' ? product.technicalSpecs : {};
  product.symptomsOfFailure = Array.isArray(product.symptomsOfFailure) ? product.symptomsOfFailure.map(String) : [];
  product.replacementInterval = String(product.replacementInterval || '');
  product.installationTips = Array.isArray(product.installationTips) ? product.installationTips.map(String) : [];
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
  if (product.discountMode === 'percent' && product.discountValue > 100) return 'PRODUCT_DISCOUNT_INVALID';
  return null;
};

const normalizeCategory = (input: any) => ({
  ...input,
  id: String(input?.id || randomUUID()).trim(),
  nameFa: String(input?.nameFa || '').trim(),
  nameEn: String(input?.nameEn || '').trim(),
  slug: String(input?.slug || '').trim(),
  icon: String(input?.icon || 'Package'),
  iconUrl: input?.iconUrl ? String(input.iconUrl) : undefined,
  imageUrl: input?.imageUrl ? String(input.imageUrl) : undefined,
  heroImageUrl: input?.heroImageUrl ? String(input.heroImageUrl) : undefined,
  description: String(input?.description || ''),
  bottomDescription: String(input?.bottomDescription || ''),
  parentId: input?.parentId ? String(input.parentId).trim() : undefined,
  subcategories: Array.isArray(input?.subcategories) ? input.subcategories : []
});

const canonicalProductForRead = async (row: CanonicalProductRow, refs?: Awaited<ReturnType<typeof loadCatalogReferenceIndex>>) => {
  const index = refs || await loadCatalogReferenceIndex(pool);
  return canonicalizeFitmentsForRead(canonicalProductDto(row), index);
};

const writeProduct = async (db: DbExecutor, product: any, status = 'active') => {
  await db.execute(
    `INSERT INTO products
      (id, sku, slug, name_fa, name_en, oem_number, part_number, category_slug, manufacturer, grade,
       price, discount_price, stock, status, images_json, specs_json, fitments_json, data_json,
       short_description, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      status,
      JSON.stringify(product.images),
      JSON.stringify(product.technicalSpecs),
      JSON.stringify(product.fitments),
      JSON.stringify(product),
      product.shortDescription || null,
      product.description || null
    ]
  );
};

const updateProductRow = async (db: DbExecutor, product: any, id: string, status?: string) => {
  const statusSql = status ? ', status = ?' : '';
  const values: any[] = [
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
  ];
  if (status) values.push(status);
  values.push(id);
  await db.execute(
    `UPDATE products SET
      sku = ?, slug = ?, name_fa = ?, name_en = ?, oem_number = ?, part_number = ?,
      category_slug = ?, manufacturer = ?, grade = ?, price = ?, discount_price = ?, stock = ?,
      images_json = ?, specs_json = ?, fitments_json = ?, data_json = ?,
      short_description = ?, description = ?${statusSql}, updated_at = NOW()
     WHERE id = ?`,
    values
  );
};

const mapIntegrityError = (error: unknown, res: any): boolean => {
  const mapped = dataIntegrityErrorResponse(error);
  if (!mapped) return false;
  res.status(mapped.status).json(mapped.body);
  return true;
};

const readCategoryTreeIds = (category: any): Set<string> => validateEmbeddedCategoryTree(category).ids;

const assertCategoryParent = async (category: any, db: DbExecutor) => {
  if (!category.parentId) return;
  if (category.parentId === category.id) throw new DataIntegrityError('CATEGORY_PARENT_SELF_REFERENCE', { id: category.id });
  const [rows] = await db.query<Array<RowDataPacket & { id: string; parent_id: string | null }>>(
    'SELECT id, parent_id FROM categories WHERE is_active = 1'
  );
  const byId = new Map(rows.map(row => [row.id, row]));
  if (!byId.has(category.parentId)) throw new DataIntegrityError('CATEGORY_PARENT_NOT_FOUND', { parentId: category.parentId });
  let cursor = category.parentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === category.id) throw new DataIntegrityError('CATEGORY_PARENT_CYCLE', { id: category.id });
    if (seen.has(cursor)) throw new DataIntegrityError('CATEGORY_PARENT_CYCLE', { id: cursor });
    seen.add(cursor);
    cursor = byId.get(cursor)?.parent_id || '';
  }
};

const assertCategoryTreeDoesNotCollide = async (category: any, db: DbExecutor, current?: any) => {
  const tree = validateEmbeddedCategoryTree(category);
  const refs = await loadCatalogReferenceIndex(db);
  const oldIds = current ? readCategoryTreeIds(current) : new Set<string>();
  const oldSlugs = current ? categorySubtreeSlugs(current) : new Set<string>();

  for (const id of tree.ids) {
    const existing = refs.categoriesById.get(id);
    if (existing && !oldIds.has(id)) throw new DataIntegrityError('CATEGORY_ID_EXISTS', { id });
  }
  for (const slug of tree.slugs) {
    const existing = refs.categoriesBySlug.get(slug);
    if (existing && !oldSlugs.has(slug)) throw new DataIntegrityError('CATEGORY_SLUG_EXISTS', { slug });
  }
};

const flattenCategoryIdSlug = (category: any) => {
  const map = new Map<string, string>();
  const walk = (node: any) => {
    const id = String(node?.id || '').trim();
    const slug = String(node?.slug || '').trim();
    if (id && slug) map.set(id, slug);
    for (const child of Array.isArray(node?.subcategories) ? node.subcategories : []) walk(child);
  };
  walk(category);
  return map;
};

const propagateCategoryRenames = async (db: DbExecutor, before: any, after: any) => {
  const beforeMap = flattenCategoryIdSlug(before);
  const afterMap = flattenCategoryIdSlug(after);
  const usage = await collectProductReferenceUsage(db);

  for (const [id, oldSlug] of beforeMap) {
    const nextSlug = afterMap.get(id);
    const users = usage.categorySlugs.get(oldSlug);
    if (!nextSlug && users?.size) {
      throw new DataIntegrityError('CATEGORY_NODE_IN_USE', { slug: oldSlug, productIds: Array.from(users).slice(0, 20) });
    }
    if (!nextSlug || nextSlug === oldSlug) continue;

    const [rows] = await db.query<Array<RowDataPacket & { id: string; category_slug: string; data_json: unknown }>>(
      `SELECT id, category_slug, data_json
       FROM products
       WHERE status = 'active' AND (category_slug = ? OR JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.subcategorySlug')) = ?)`,
      [oldSlug, oldSlug]
    );
    for (const row of rows) {
      const data = parseStoredJson<Record<string, any>>(row.data_json, {});
      const categorySlug = row.category_slug === oldSlug ? nextSlug : row.category_slug;
      if (String(data.categorySlug || '') === oldSlug) data.categorySlug = nextSlug;
      if (String(data.subcategorySlug || '') === oldSlug) data.subcategorySlug = nextSlug;
      await db.execute(
        'UPDATE products SET category_slug = ?, data_json = ?, updated_at = NOW() WHERE id = ?',
        [categorySlug, JSON.stringify(data), row.id]
      );
    }
  }
};

export const catalogRouter = Router();

catalogRouter.get('/products', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 120);
  const category = String(req.query.category || '').trim().slice(0, 190);
  const limit = Math.max(1, Math.min(100, Math.floor(Number(req.query.limit) || 48)));
  const offset = Math.max(0, Math.min(10000000, Math.floor(Number(req.query.offset) || 0)));
  const params: any[] = [];
  const clauses = ["status = 'active'"];

  if (category) {
    clauses.push("(category_slug = ? OR JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.subcategorySlug')) = ?)");
    params.push(category, category);
  }
  if (q) {
    clauses.push('(name_fa LIKE ? OR name_en LIKE ? OR oem_number LIKE ? OR part_number LIKE ? OR sku LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  const whereSql = clauses.join(' AND ');
  const [[countRow], [rows], refs] = await Promise.all([
    pool.query<Array<RowDataPacket & { total: number }>>(
      `SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`,
      params
    ),
    pool.query<CanonicalProductRow[]>(
      `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE ${whereSql}
       ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
    loadCatalogReferenceIndex(pool)
  ]);
  const products = rows.map(row => canonicalizeFitmentsForRead(canonicalProductDto(row), refs));
  const total = Number(countRow?.total || 0);
  res.json({
    products,
    total,
    offset,
    limit,
    nextOffset: offset + products.length,
    hasMore: offset + products.length < total
  });
});

catalogRouter.get('/products/:idOrSlug', async (req, res) => {
  const key = String(req.params.idOrSlug || '');
  const [[rows], refs] = await Promise.all([
    pool.query<CanonicalProductRow[]>(
      `SELECT ${PRODUCT_CANONICAL_COLUMNS}
       FROM products WHERE status = 'active' AND (id = ? OR slug = ?) LIMIT 1`,
      [key, key]
    ),
    loadCatalogReferenceIndex(pool)
  ]);
  if (!rows[0]) {
    res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    return;
  }
  res.json({ product: canonicalizeFitmentsForRead(canonicalProductDto(rows[0]), refs) });
});

catalogRouter.post('/products', requireAdminPermission('canManageProducts'), async (req, res) => {
  try {
    const refs = await loadCatalogReferenceIndex(pool);
    let product = normalizeProduct(req.body);
    const invalid = validateProduct(product);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }
    product = canonicalizeProductReferences(product, refs, product.id);

    await writeProduct(pool, product);
    const [rows] = await pool.query<CanonicalProductRow[]>(
      `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE id = ? LIMIT 1`,
      [product.id]
    );
    res.status(201).json({ product: await canonicalProductForRead(rows[0], refs) });
  } catch (error: any) {
    if (mapIntegrityError(error, res)) return;
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'PRODUCT_DUPLICATE_SKU_OR_SLUG' });
      return;
    }
    throw error;
  }
});

catalogRouter.put('/products/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  try {
    const productId = String(req.params.id || '');
    const result = await withTransaction(async tx => {
      const [currentRows] = await tx.query<CanonicalProductRow[]>(
        `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE id = ? FOR UPDATE`,
        [productId]
      );
      const current = currentRows[0];
      if (!current) return null;

      let product = normalizeProduct({ ...req.body, id: productId });
      const invalid = validateProduct(product);
      if (invalid) throw new DataIntegrityError(invalid);
      if (product.stock < Number(current.reserved_stock || 0)) {
        throw new DataIntegrityError('STOCK_BELOW_ACTIVE_RESERVATIONS', { reserved: Number(current.reserved_stock || 0) });
      }
      const refs = await loadCatalogReferenceIndex(tx);
      product = canonicalizeProductReferences(product, refs, productId);
      await updateProductRow(tx, product, productId);
      const [savedRows] = await tx.query<CanonicalProductRow[]>(
        `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE id = ? LIMIT 1`,
        [productId]
      );
      return { row: savedRows[0], refs };
    });

    if (!result) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    res.json({ product: canonicalizeFitmentsForRead(canonicalProductDto(result.row), result.refs) });
  } catch (error: any) {
    if (mapIntegrityError(error, res)) return;
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

  try {
    const saved = await withTransaction(async tx => {
      const refs = await loadCatalogReferenceIndex(tx);
      const updatedIds: string[] = [];
      for (const update of updates) {
        const id = String(update.id || '');
        if (!id || updatedIds.includes(id)) continue;
        const [rows] = await tx.query<CanonicalProductRow[]>(
          `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE id = ? FOR UPDATE`,
          [id]
        );
        const row = rows[0];
        if (!row) continue;
        const base = canonicalProductDto(row);
        let product = normalizeProduct({
          ...base,
          stock: update.stock !== undefined ? update.stock : Number(row.stock),
          ...(update.price !== undefined ? { price: update.price } : {})
        });
        if (product.stock < Number(row.reserved_stock || 0)) {
          throw new DataIntegrityError('STOCK_BELOW_ACTIVE_RESERVATIONS', { id, reserved: Number(row.reserved_stock || 0) });
        }
        product = canonicalizeProductReferences(product, refs, id);
        const status = update.status === undefined
          ? undefined
          : ['active', 'inactive', 'deleted'].includes(String(update.status))
            ? String(update.status)
            : (() => { throw new DataIntegrityError('PRODUCT_STATUS_INVALID', { id }); })();
        await updateProductRow(tx, product, id, status);
        updatedIds.push(id);
      }

      if (!updatedIds.length) return [];
      const [rows] = await tx.query<CanonicalProductRow[]>(
        `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE id IN (${updatedIds.map(() => '?').join(',')})`,
        updatedIds
      );
      return rows.map(row => canonicalizeFitmentsForRead(canonicalProductDto(row), refs));
    });
    res.json({ ok: true, updated: saved.length, products: saved });
  } catch (error) {
    if (mapIntegrityError(error, res)) return;
    throw error;
  }
});

catalogRouter.delete('/products/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const productId = String(req.params.id || '');
  try {
    const outcome = await withTransaction(async tx => {
      const [rows] = await tx.query<Array<RowDataPacket & { id: string; reserved_stock: number }>>(
        'SELECT id, reserved_stock FROM products WHERE id = ? AND status <> \'deleted\' FOR UPDATE',
        [productId]
      );
      if (!rows[0]) return 'missing' as const;
      if (Number(rows[0].reserved_stock || 0) > 0) throw new DataIntegrityError('PRODUCT_HAS_ACTIVE_RESERVATIONS');

      const usage = await collectProductReferenceUsage(tx);
      const referringIds = Array.from(usage.productLinks.get(productId) || []);
      for (const referringId of referringIds) {
        const [linkedRows] = await tx.query<Array<RowDataPacket & { data_json: unknown }>>(
          'SELECT data_json FROM products WHERE id = ? FOR UPDATE',
          [referringId]
        );
        if (!linkedRows[0]) continue;
        const data = parseStoredJson<Record<string, any>>(linkedRows[0].data_json, {});
        data.complementPartIds = (Array.isArray(data.complementPartIds) ? data.complementPartIds : []).filter((id: any) => String(id) !== productId);
        data.relatedPartIds = (Array.isArray(data.relatedPartIds) ? data.relatedPartIds : []).filter((id: any) => String(id) !== productId);
        await tx.execute('UPDATE products SET data_json = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(data), referringId]);
      }
      await tx.execute("UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = ?", [productId]);
      return 'ok' as const;
    });
    if (outcome === 'missing') {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    if (mapIntegrityError(error, res)) return;
    throw error;
  }
});

catalogRouter.get('/categories', async (_req, res) => {
  const [rows] = await pool.query<CanonicalCategoryRow[]>(
    `SELECT id, slug, name_fa, name_en, parent_id, description, data_json, is_active, sort_order
     FROM categories
     WHERE is_active = 1 AND parent_id IS NULL
     ORDER BY sort_order ASC, name_fa ASC`
  );
  res.json({ categories: rows.map(canonicalCategoryDto) });
});

catalogRouter.post('/categories', requireAdminPermission('canManageProducts'), async (req, res) => {
  const category = normalizeCategory(req.body);
  if (!category.slug || !category.nameFa) {
    res.status(400).json({ error: 'CATEGORY_DATA_INVALID' });
    return;
  }

  try {
    validateEmbeddedCategoryTree(category);
    await assertCategoryParent(category, pool);
    await assertCategoryTreeDoesNotCollide(category, pool);
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
    if (mapIntegrityError(error, res)) return;
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'CATEGORY_SLUG_EXISTS' });
      return;
    }
    throw error;
  }
});

catalogRouter.put('/categories/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const category = normalizeCategory({ ...req.body, id: req.params.id });
  if (!category.slug || !category.nameFa) {
    res.status(400).json({ error: 'CATEGORY_DATA_INVALID' });
    return;
  }

  try {
    const result = await withTransaction(async tx => {
      const [currentRows] = await tx.query<CanonicalCategoryRow[]>(
        `SELECT id, slug, name_fa, name_en, parent_id, description, data_json, is_active, sort_order
         FROM categories WHERE id = ? FOR UPDATE`,
        [category.id]
      );
      if (!currentRows[0]) return null;
      const current = canonicalCategoryDto(currentRows[0]);
      validateEmbeddedCategoryTree(category);
      await assertCategoryParent(category, tx);
      await assertCategoryTreeDoesNotCollide(category, tx, current);
      await propagateCategoryRenames(tx, current, category);

      await tx.execute(
        `UPDATE categories SET
          slug = ?, name_fa = ?, name_en = ?, parent_id = ?, description = ?, data_json = ?, is_active = 1, updated_at = NOW()
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
      return category;
    });
    if (!result) {
      res.status(404).json({ error: 'CATEGORY_NOT_FOUND' });
      return;
    }
    res.json({ category: result });
  } catch (error: any) {
    if (mapIntegrityError(error, res)) return;
    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'CATEGORY_SLUG_EXISTS' });
      return;
    }
    throw error;
  }
});

catalogRouter.delete('/categories/:id', requireAdminPermission('canManageProducts'), async (req, res) => {
  const categoryId = String(req.params.id || '');
  try {
    const result = await withTransaction(async tx => {
      const [rows] = await tx.query<CanonicalCategoryRow[]>(
        `SELECT id, slug, name_fa, name_en, parent_id, description, data_json, is_active, sort_order
         FROM categories WHERE id = ? AND is_active = 1 FOR UPDATE`,
        [categoryId]
      );
      if (!rows[0]) return 'missing' as const;
      const [children] = await tx.query<Array<RowDataPacket & { id: string }>>(
        'SELECT id FROM categories WHERE parent_id = ? AND is_active = 1 LIMIT 1',
        [categoryId]
      );
      if (children[0]) throw new DataIntegrityError('CATEGORY_HAS_CHILDREN');

      const category = canonicalCategoryDto(rows[0]);
      const slugs = categorySubtreeSlugs(category);
      const usage = await collectProductReferenceUsage(tx);
      const productIds = new Set<string>();
      for (const slug of slugs) {
        for (const productId of usage.categorySlugs.get(slug) || []) productIds.add(productId);
      }
      if (productIds.size) {
        throw new DataIntegrityError('CATEGORY_IN_USE', { productIds: Array.from(productIds).slice(0, 20) });
      }
      await tx.execute('UPDATE categories SET is_active = 0, updated_at = NOW() WHERE id = ?', [categoryId]);
      return 'ok' as const;
    });

    if (result === 'missing') {
      res.status(404).json({ error: 'CATEGORY_NOT_FOUND' });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    if (mapIntegrityError(error, res)) return;
    throw error;
  }
});

catalogRouter.get('/integrity', requireAdminPermission('canManageProducts'), async (_req, res) => {
  const refs = await loadCatalogReferenceIndex(pool);
  const issues: Array<Record<string, unknown>> = refs.categoryConflicts.map(code => ({ code }));

  const [modelRows] = await pool.query<Array<RowDataPacket & { id: string; brand_id: string }>>(
    'SELECT id, brand_id FROM vehicle_models WHERE is_active = 1'
  );
  for (const model of modelRows) {
    if (!refs.brandsById.has(model.brand_id)) issues.push({ code: 'ORPHAN_VEHICLE_MODEL', modelId: model.id, brandId: model.brand_id });
  }

  const [categoryRows] = await pool.query<Array<RowDataPacket & { id: string; parent_id: string | null }>>(
    'SELECT id, parent_id FROM categories WHERE is_active = 1'
  );
  const categoryIds = new Set(categoryRows.map(row => row.id));
  for (const category of categoryRows) {
    if (category.parent_id && !categoryIds.has(category.parent_id)) {
      issues.push({ code: 'ORPHAN_CATEGORY_PARENT', categoryId: category.id, parentId: category.parent_id });
    }
  }

  const [productRows] = await pool.query<CanonicalProductRow[]>(
    `SELECT ${PRODUCT_CANONICAL_COLUMNS} FROM products WHERE status = 'active'`
  );
  for (const row of productRows) {
    const dto = canonicalProductDto(row);
    try {
      canonicalizeProductReferences(dto, refs, row.id);
    } catch (error) {
      if (error instanceof DataIntegrityError) {
        issues.push({ code: error.code, productId: row.id, ...(error.details || {}) });
      } else {
        throw error;
      }
    }

    const stored = parseStoredJson<Record<string, any>>(row.data_json, {});
    const drift: string[] = [];
    const checks: Array<[string, unknown]> = [
      ['id', row.id], ['sku', row.sku], ['slug', row.slug], ['nameFa', row.name_fa],
      ['categorySlug', row.category_slug], ['price', Number(row.price || 0)], ['stock', Number(row.stock || 0)]
    ];
    for (const [key, value] of checks) {
      if (stored[key] !== undefined && String(stored[key]) !== String(value)) drift.push(key);
    }
    if (drift.length) issues.push({ code: 'PRODUCT_SQL_JSON_DRIFT', productId: row.id, fields: drift });
  }

  res.json({ ok: issues.length === 0, issueCount: issues.length, issues: issues.slice(0, 500) });
});
