import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

export type DbExecutor = Pool | PoolConnection;

export const parseStoredJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
};

export interface CanonicalProductRow extends RowDataPacket {
  id: string;
  sku: string;
  slug: string;
  name_fa: string;
  name_en: string | null;
  oem_number: string | null;
  part_number: string | null;
  category_slug: string;
  manufacturer: string | null;
  grade: string | null;
  price: number | string;
  discount_price: number | string | null;
  stock: number;
  reserved_stock: number;
  images_json: unknown;
  specs_json: unknown;
  fitments_json: unknown;
  data_json: unknown;
  short_description: string | null;
  description: string | null;
}

export const PRODUCT_CANONICAL_COLUMNS = `
  id, sku, slug, name_fa, name_en, oem_number, part_number, category_slug,
  manufacturer, grade, price, discount_price, stock, reserved_stock,
  images_json, specs_json, fitments_json, data_json, short_description, description
`;

export const canonicalProductDto = (row: CanonicalProductRow, overrideFitments?: any[]): Record<string, any> => {
  const data = parseStoredJson<Record<string, any>>(row.data_json, {});
  const images = parseStoredJson<any[]>(row.images_json, Array.isArray(data.images) ? data.images : []);
  const specs = parseStoredJson<Record<string, string>>(row.specs_json, data.technicalSpecs && typeof data.technicalSpecs === 'object' ? data.technicalSpecs : {});
  const fitments = overrideFitments ?? parseStoredJson<any[]>(row.fitments_json, Array.isArray(data.fitments) ? data.fitments : []);
  const physicalStock = Math.max(0, Number(row.stock || 0));
  const reservedStock = Math.max(0, Number(row.reserved_stock || 0));
  const availableStock = Math.max(0, physicalStock - reservedStock);

  // SQL columns are authoritative. data_json is extension/content storage only;
  // the final explicit fields deliberately prevent stale JSON from overriding SQL.
  return {
    ...data,
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    nameFa: row.name_fa,
    nameEn: row.name_en || '',
    oemNumber: row.oem_number || '',
    partNumber: row.part_number || '',
    categorySlug: row.category_slug,
    brandManufacturer: row.manufacturer || '',
    grade: row.grade || 'aftermarket',
    price: Number(row.price || 0),
    discountPrice: row.discount_price == null ? undefined : Number(row.discount_price),
    stock: availableStock,
    stockStatus: availableStock <= 0 ? 'out_of_stock' : availableStock <= 3 ? 'low_stock' : 'in_stock',
    images,
    technicalSpecs: specs,
    fitments,
    shortDescription: row.short_description || '',
    description: row.description || ''
  };
};

export interface CanonicalCategoryRow extends RowDataPacket {
  id: string;
  slug: string;
  name_fa: string;
  name_en: string | null;
  parent_id: string | null;
  description: string | null;
  data_json: unknown;
  is_active: number;
  sort_order: number;
}

export const canonicalCategoryDto = (row: CanonicalCategoryRow): Record<string, any> => ({
  ...parseStoredJson<Record<string, any>>(row.data_json, {}),
  id: row.id,
  slug: row.slug,
  nameFa: row.name_fa,
  nameEn: row.name_en || '',
  parentId: row.parent_id || undefined,
  description: row.description || ''
});

export interface CanonicalBrandRow extends RowDataPacket {
  id: string;
  slug: string;
  name_fa: string;
  name_en: string | null;
  data_json: unknown;
  is_active: number;
}

export const canonicalBrandDto = (row: CanonicalBrandRow): Record<string, any> => ({
  ...parseStoredJson<Record<string, any>>(row.data_json, {}),
  id: row.id,
  slug: row.slug,
  nameFa: row.name_fa,
  nameEn: row.name_en || ''
});

export interface CanonicalModelRow extends RowDataPacket {
  id: string;
  brand_id: string;
  slug: string;
  name_fa: string;
  name_en: string | null;
  data_json: unknown;
  is_active: number;
}

export const canonicalModelDto = (row: CanonicalModelRow): Record<string, any> => ({
  ...parseStoredJson<Record<string, any>>(row.data_json, {}),
  id: row.id,
  brandId: row.brand_id,
  slug: row.slug,
  nameFa: row.name_fa,
  nameEn: row.name_en || ''
});

export interface CategoryReference {
  id: string;
  slug: string;
  rootId: string;
  rootSlug: string;
  parentId?: string;
}

export interface VehicleReference {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  brandId: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface BrandReference {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
}

export interface CatalogReferenceIndex {
  categoriesBySlug: Map<string, CategoryReference>;
  categoriesById: Map<string, CategoryReference>;
  brandsById: Map<string, BrandReference>;
  modelsById: Map<string, VehicleReference>;
  productIds: Set<string>;
  categoryConflicts: string[];
}

const flattenEmbeddedCategories = (
  nodes: any[],
  root: CategoryReference,
  parentId: string | undefined,
  bySlug: Map<string, CategoryReference>,
  byId: Map<string, CategoryReference>,
  conflicts: string[]
) => {
  for (const raw of nodes || []) {
    const id = String(raw?.id || '').trim();
    const slug = String(raw?.slug || '').trim();
    if (!id || !slug) continue;
    const ref: CategoryReference = { id, slug, rootId: root.rootId, rootSlug: root.rootSlug, parentId };
    const slugExisting = bySlug.get(slug);
    const idExisting = byId.get(id);
    if (slugExisting && slugExisting.id !== id) conflicts.push(`duplicate-category-slug:${slug}`);
    if (idExisting && idExisting.slug !== slug) conflicts.push(`duplicate-category-id:${id}`);
    bySlug.set(slug, ref);
    byId.set(id, ref);
    if (Array.isArray(raw?.subcategories)) {
      flattenEmbeddedCategories(raw.subcategories, root, id, bySlug, byId, conflicts);
    }
  }
};

export const loadCatalogReferenceIndex = async (db: DbExecutor): Promise<CatalogReferenceIndex> => {
  const [[categoryRows], [brandRows], [modelRows], [productRows]] = await Promise.all([
    db.query<CanonicalCategoryRow[]>(
      `SELECT id, slug, name_fa, name_en, parent_id, description, data_json, is_active, sort_order
       FROM categories WHERE is_active = 1`
    ),
    db.query<CanonicalBrandRow[]>(
      `SELECT id, slug, name_fa, name_en, data_json, is_active
       FROM vehicle_brands WHERE is_active = 1`
    ),
    db.query<CanonicalModelRow[]>(
      `SELECT id, brand_id, slug, name_fa, name_en, data_json, is_active
       FROM vehicle_models WHERE is_active = 1`
    ),
    db.query<Array<RowDataPacket & { id: string }>>(
      `SELECT id FROM products WHERE status = 'active'`
    )
  ]);

  const categoriesBySlug = new Map<string, CategoryReference>();
  const categoriesById = new Map<string, CategoryReference>();
  const categoryConflicts: string[] = [];
  const rowById = new Map(categoryRows.map(row => [row.id, row]));

  const resolveRoot = (row: CanonicalCategoryRow): CanonicalCategoryRow => {
    let cursor = row;
    const seen = new Set<string>();
    while (cursor.parent_id && rowById.has(cursor.parent_id) && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      cursor = rowById.get(cursor.parent_id)!;
    }
    return cursor;
  };

  for (const row of categoryRows) {
    const rootRow = resolveRoot(row);
    const root: CategoryReference = {
      id: rootRow.id,
      slug: rootRow.slug,
      rootId: rootRow.id,
      rootSlug: rootRow.slug
    };
    const ref: CategoryReference = {
      id: row.id,
      slug: row.slug,
      rootId: root.rootId,
      rootSlug: root.rootSlug,
      parentId: row.parent_id || undefined
    };
    const slugExisting = categoriesBySlug.get(row.slug);
    if (slugExisting && slugExisting.id !== row.id) categoryConflicts.push(`duplicate-category-slug:${row.slug}`);
    categoriesBySlug.set(row.slug, ref);
    categoriesById.set(row.id, ref);
  }

  // Historical versions embedded subcategories in the root data_json. Keep them
  // addressable, but SQL rows still win when the same id/slug exists in both forms.
  for (const row of categoryRows.filter(item => !item.parent_id)) {
    const data = canonicalCategoryDto(row);
    const root = categoriesById.get(row.id)!;
    const beforeSlugs = new Set(categoriesBySlug.keys());
    const embeddedBySlug = new Map(categoriesBySlug);
    const embeddedById = new Map(categoriesById);
    flattenEmbeddedCategories(data.subcategories || [], root, row.id, embeddedBySlug, embeddedById, categoryConflicts);
    for (const [slug, ref] of embeddedBySlug) {
      if (!beforeSlugs.has(slug)) categoriesBySlug.set(slug, ref);
    }
    for (const [id, ref] of embeddedById) {
      if (!categoriesById.has(id)) categoriesById.set(id, ref);
    }
  }

  const brandsById = new Map<string, BrandReference>();
  for (const row of brandRows) {
    brandsById.set(row.id, {
      id: row.id,
      slug: row.slug,
      nameFa: row.name_fa,
      nameEn: row.name_en || ''
    });
  }

  const modelsById = new Map<string, VehicleReference>();
  for (const row of modelRows) {
    const data = canonicalModelDto(row);
    modelsById.set(row.id, {
      id: row.id,
      slug: row.slug,
      nameFa: row.name_fa,
      nameEn: row.name_en || '',
      brandId: row.brand_id,
      yearFrom: Number(data.yearFrom || 0) || undefined,
      yearTo: Number(data.yearTo || 0) || undefined
    });
  }

  return {
    categoriesBySlug,
    categoriesById,
    brandsById,
    modelsById,
    productIds: new Set(productRows.map(row => row.id)),
    categoryConflicts
  };
};

const uniqueStrings = (value: unknown): string[] =>
  Array.from(new Set((Array.isArray(value) ? value : []).map(item => String(item || '').trim()).filter(Boolean)));

export class DataIntegrityError extends Error {
  constructor(public code: string, public details?: Record<string, unknown>) {
    super(code);
    this.name = 'DataIntegrityError';
  }
}

export const canonicalizeProductReferences = (
  input: Record<string, any>,
  refs: CatalogReferenceIndex,
  productId?: string
): Record<string, any> => {
  const product = { ...input };
  const categorySlug = String(product.categorySlug || '').trim();
  const categoryRef = refs.categoriesBySlug.get(categorySlug);
  if (!categoryRef) throw new DataIntegrityError('PRODUCT_CATEGORY_NOT_FOUND', { categorySlug });

  const subcategorySlug = String(product.subcategorySlug || '').trim();
  if (subcategorySlug) {
    const subRef = refs.categoriesBySlug.get(subcategorySlug);
    if (!subRef) throw new DataIntegrityError('PRODUCT_SUBCATEGORY_NOT_FOUND', { subcategorySlug });
    if (subRef.rootId !== categoryRef.rootId && subRef.id !== categoryRef.id) {
      throw new DataIntegrityError('PRODUCT_CATEGORY_TREE_MISMATCH', { categorySlug, subcategorySlug });
    }
  }

  const explicitModelIds = uniqueStrings(product.vehicleModelIds);
  const explicitBrandIds = uniqueStrings(product.vehicleBrandIds);
  for (const brandId of explicitBrandIds) {
    if (!refs.brandsById.has(brandId)) throw new DataIntegrityError('PRODUCT_VEHICLE_BRAND_NOT_FOUND', { brandId });
  }
  for (const modelId of explicitModelIds) {
    if (!refs.modelsById.has(modelId)) throw new DataIntegrityError('PRODUCT_VEHICLE_MODEL_NOT_FOUND', { modelId });
  }

  const fitments = (Array.isArray(product.fitments) ? product.fitments : []).map((raw: any, index: number) => {
    const modelId = String(raw?.modelId || '').trim();
    if (!modelId) throw new DataIntegrityError('PRODUCT_FITMENT_MODEL_REQUIRED', { index });
    const model = refs.modelsById.get(modelId);
    if (!model) throw new DataIntegrityError('PRODUCT_FITMENT_MODEL_NOT_FOUND', { index, modelId });
    const brand = refs.brandsById.get(model.brandId);
    if (!brand) throw new DataIntegrityError('PRODUCT_FITMENT_BRAND_NOT_FOUND', { index, brandId: model.brandId });
    const suppliedBrandId = String(raw?.brandId || '').trim();
    if (suppliedBrandId && suppliedBrandId !== model.brandId) {
      throw new DataIntegrityError('PRODUCT_FITMENT_BRAND_MODEL_MISMATCH', { index, modelId, brandId: suppliedBrandId, expectedBrandId: model.brandId });
    }
    return {
      ...raw,
      id: String(raw?.id || `fit-${modelId}-${index + 1}`),
      brandId: brand.id,
      brandName: brand.nameFa,
      modelId: model.id,
      modelName: model.nameFa,
      yearFrom: Math.max(0, Math.floor(Number(raw?.yearFrom || model.yearFrom || 0))),
      yearTo: Math.max(0, Math.floor(Number(raw?.yearTo || model.yearTo || 0))),
      engine: String(raw?.engine || '').trim(),
      engineCode: raw?.engineCode ? String(raw.engineCode).trim() : undefined,
      transmission: raw?.transmission ? String(raw.transmission).trim() : undefined,
      notes: raw?.notes ? String(raw.notes).trim() : undefined
    };
  });

  const fitmentKeys = new Set<string>();
  for (const fitment of fitments) {
    const key = [fitment.modelId, fitment.yearFrom, fitment.yearTo, fitment.engine, fitment.engineCode || ''].join('|');
    if (fitmentKeys.has(key)) throw new DataIntegrityError('PRODUCT_FITMENT_DUPLICATE', { modelId: fitment.modelId });
    fitmentKeys.add(key);
  }

  const modelIds = uniqueStrings([...explicitModelIds, ...fitments.map((item: any) => item.modelId)]);
  const brandIds = uniqueStrings([
    ...explicitBrandIds,
    ...modelIds.map(modelId => refs.modelsById.get(modelId)?.brandId || ''),
    ...fitments.map((item: any) => item.brandId)
  ]);

  const validateProductLinks = (value: unknown, field: 'complementPartIds' | 'relatedPartIds') => {
    const ids = uniqueStrings(value);
    for (const id of ids) {
      if (id === productId) throw new DataIntegrityError('PRODUCT_SELF_REFERENCE', { field, id });
      if (!refs.productIds.has(id)) throw new DataIntegrityError('PRODUCT_REFERENCE_NOT_FOUND', { field, id });
    }
    return ids;
  };

  return {
    ...product,
    categorySlug,
    subcategorySlug: subcategorySlug || undefined,
    vehicleModelIds: modelIds,
    vehicleBrandIds: brandIds,
    fitments,
    complementPartIds: validateProductLinks(product.complementPartIds, 'complementPartIds'),
    relatedPartIds: validateProductLinks(product.relatedPartIds, 'relatedPartIds')
  };
};

export const canonicalizeFitmentsForRead = (
  product: Record<string, any>,
  refs: CatalogReferenceIndex
): Record<string, any> => {
  const fitments = Array.isArray(product.fitments) ? product.fitments : [];
  const normalized = fitments.flatMap((raw: any) => {
    const model = refs.modelsById.get(String(raw?.modelId || ''));
    if (!model) return [];
    const brand = refs.brandsById.get(model.brandId);
    if (!brand) return [];
    return [{
      ...raw,
      brandId: brand.id,
      brandName: brand.nameFa,
      modelId: model.id,
      modelName: model.nameFa
    }];
  });
  return {
    ...product,
    fitments: normalized,
    vehicleModelIds: uniqueStrings((product.vehicleModelIds || []).filter((id: string) => refs.modelsById.has(id))),
    vehicleBrandIds: uniqueStrings((product.vehicleBrandIds || []).filter((id: string) => refs.brandsById.has(id)))
  };
};

export const collectProductReferenceUsage = async (db: DbExecutor) => {
  const [rows] = await db.query<Array<RowDataPacket & {
    id: string;
    category_slug: string;
    fitments_json: unknown;
    data_json: unknown;
  }>>(
    `SELECT id, category_slug, fitments_json, data_json
     FROM products WHERE status = 'active'`
  );

  const categorySlugs = new Map<string, Set<string>>();
  const brandIds = new Map<string, Set<string>>();
  const modelIds = new Map<string, Set<string>>();
  const productLinks = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, productId: string) => {
    if (!key) return;
    const set = map.get(key) || new Set<string>();
    set.add(productId);
    map.set(key, set);
  };

  for (const row of rows) {
    const data = parseStoredJson<Record<string, any>>(row.data_json, {});
    const fitments = parseStoredJson<any[]>(row.fitments_json, Array.isArray(data.fitments) ? data.fitments : []);
    add(categorySlugs, row.category_slug, row.id);
    add(categorySlugs, String(data.subcategorySlug || ''), row.id);
    for (const id of uniqueStrings(data.vehicleBrandIds)) add(brandIds, id, row.id);
    for (const id of uniqueStrings(data.vehicleModelIds)) add(modelIds, id, row.id);
    for (const fitment of fitments) {
      add(brandIds, String(fitment?.brandId || ''), row.id);
      add(modelIds, String(fitment?.modelId || ''), row.id);
    }
    for (const id of uniqueStrings([...(data.complementPartIds || []), ...(data.relatedPartIds || [])])) add(productLinks, id, row.id);
  }

  return { categorySlugs, brandIds, modelIds, productLinks };
};

export const categorySubtreeSlugs = (category: Record<string, any>): Set<string> => {
  const slugs = new Set<string>();
  const walk = (node: any) => {
    const slug = String(node?.slug || '').trim();
    if (slug) slugs.add(slug);
    for (const child of Array.isArray(node?.subcategories) ? node.subcategories : []) walk(child);
  };
  walk(category);
  return slugs;
};

export const validateEmbeddedCategoryTree = (category: Record<string, any>) => {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const walk = (node: any, ancestry: Set<string>) => {
    const id = String(node?.id || '').trim();
    const slug = String(node?.slug || '').trim();
    if (!id || !slug) throw new DataIntegrityError('CATEGORY_TREE_NODE_INVALID');
    if (ancestry.has(id)) throw new DataIntegrityError('CATEGORY_TREE_CYCLE', { id });
    if (ids.has(id)) throw new DataIntegrityError('CATEGORY_TREE_DUPLICATE_ID', { id });
    if (slugs.has(slug)) throw new DataIntegrityError('CATEGORY_TREE_DUPLICATE_SLUG', { slug });
    ids.add(id);
    slugs.add(slug);
    const next = new Set(ancestry);
    next.add(id);
    for (const child of Array.isArray(node?.subcategories) ? node.subcategories : []) walk(child, next);
  };
  walk(category, new Set());
  return { ids, slugs };
};

export const dataIntegrityErrorResponse = (error: unknown): { status: number; body: Record<string, unknown> } | null => {
  if (!(error instanceof DataIntegrityError)) return null;
  return { status: 409, body: { error: error.code, ...(error.details || {}) } };
};
