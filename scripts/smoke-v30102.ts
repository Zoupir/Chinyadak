import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { pool, type RowDataPacket } from '../src/server/db';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const origin = new URL(base).origin;
const source = (file: string) => fs.readFileSync(file, 'utf8');

assert.match(source('src/server/routes/catalog.ts'), /canonicalProductDto/);
assert.match(source('src/server/routes/catalog.ts'), /catalogRouter\.get\('\/integrity'/);
assert.match(source('src/server/routes/catalog.ts'), /canonicalizeProductReferences/);
assert.match(source('src/server/routes/vehicles.ts'), /VEHICLE_MODEL_IN_USE/);
assert.match(source('src/server/routes/vehicles.ts'), /VEHICLE_BRAND_IN_USE/);
assert.match(source('src/server/routes/bulk.ts'), /PRODUCT_REFERENCED_BY_OTHER_PRODUCTS/);
assert.match(source('src/context/StoreContext.tsx'), /data-v30102-vehicle-state-reconcile/);
assert.match(source('src/context/StoreContext.tsx'), /const byId = new Map\(saved\.map/);

const sameOriginHeaders = (cookie?: string): Record<string, string> => ({
  'content-type': 'application/json',
  origin,
  'sec-fetch-site': 'same-origin',
  ...(cookie ? { cookie } : {})
});

const request = async (path: string, init: RequestInit = {}, expected?: number) => {
  const response = await fetch(base + path, init);
  if (expected !== undefined && response.status !== expected) {
    const body = await response.text().catch(() => '');
    throw new Error(`${init.method || 'GET'} ${path}: expected ${expected}, got ${response.status}: ${body}`);
  }
  return response;
};

const json = async <T>(path: string, init: RequestInit = {}, expected = 200): Promise<{ response: Response; data: T }> => {
  const response = await request(path, init, expected);
  return { response, data: await response.json() as T };
};

const run = async () => {
  const login = await json<{ admin: any }>('/api/auth/admin/login', {
    method: 'POST',
    headers: sameOriginHeaders(),
    body: JSON.stringify({
      username: process.env.ADMIN_BOOTSTRAP_USER || 'admin',
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD || ''
    })
  });
  const adminCookie = String(login.response.headers.get('set-cookie') || '').split(';')[0];
  assert(adminCookie, 'Admin session cookie missing.');

  const suffix = randomUUID().slice(0, 8);
  const categoryId = randomUUID();
  const categorySlug = `stage3-category-${suffix}`;
  const brandId = `stage3-brand-${suffix}`;
  const brandSlug = `stage3-brand-${suffix}`;
  const modelId = `stage3-model-${suffix}`;
  const modelSlug = `stage3-model-${suffix}`;
  const productAId = randomUUID();
  const productBId = randomUUID();

  await json('/api/catalog/categories', {
    method: 'POST',
    headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify({
      id: categoryId,
      slug: categorySlug,
      nameFa: 'دسته تست یکپارچگی',
      nameEn: 'Stage 3 Integrity',
      icon: 'Package',
      description: 'CI fixture',
      subcategories: []
    })
  }, 201);

  await json('/api/vehicles/brands', {
    method: 'POST',
    headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify({
      id: brandId,
      slug: brandSlug,
      nameFa: 'برند تست مرحله سه',
      nameEn: 'Stage3 Brand',
      logo: '', heroImage: '', description: '', country: 'CN', foundedYear: 2026, faq: []
    })
  }, 201);

  await json('/api/vehicles/models', {
    method: 'POST',
    headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify({
      id: modelId,
      brandId,
      slug: modelSlug,
      nameFa: 'مدل تست مرحله سه',
      nameEn: 'Stage3 Model',
      imageUrl: '', yearFrom: 2025, yearTo: 2026,
      bodyType: 'کراس‌اوور', engineSummary: '1.6T', transmissionSummary: 'DCT',
      description: '', specifications: {}, faq: []
    })
  }, 201);

  const productPayload = (id: string, sku: string, slug: string, extra: Record<string, unknown> = {}) => ({
    id,
    sku,
    slug,
    nameFa: `محصول تست ${sku}`,
    nameEn: 'Stage 3 Product',
    oemNumber: `OEM-${suffix}`,
    partNumber: `PART-${suffix}`,
    categorySlug,
    brandManufacturer: 'Stage3 Parts',
    grade: 'aftermarket',
    price: 1_500_000,
    stock: 9,
    images: [], rating: 0, reviewsCount: 0, weightKg: 0, dimensionsCm: '', countryOfOrigin: 'CN',
    warrantyMonths: 0, warrantyDescription: '', placement: '', description: '', technicalSpecs: {},
    symptomsOfFailure: [], replacementInterval: '', installationTips: [], genuineVsFakeNotes: '',
    vehicleModelIds: [modelId], vehicleBrandIds: [brandId],
    fitments: [{
      id: `fit-${id}`,
      brandId,
      brandName: 'نام قدیمی قابل اعتماد نیست',
      modelId,
      modelName: 'نام قدیمی قابل اعتماد نیست',
      yearFrom: 2025,
      yearTo: 2026,
      engine: '1.6T'
    }],
    complementPartIds: [], relatedPartIds: [],
    ...extra
  });

  const createdA = await json<{ product: any }>('/api/catalog/products', {
    method: 'POST', headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify(productPayload(productAId, `S3A-${suffix}`, `s3-a-${suffix}`))
  }, 201);
  assert.equal(createdA.data.product.fitments[0].brandName, 'برند تست مرحله سه');
  assert.equal(createdA.data.product.fitments[0].modelName, 'مدل تست مرحله سه');

  const mismatch = await json<{ error: string }>('/api/catalog/products', {
    method: 'POST', headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify(productPayload(randomUUID(), `S3BAD-${suffix}`, `s3-bad-${suffix}`, {
      fitments: [{ id: 'bad-fit', brandId: 'wrong-brand', modelId, yearFrom: 2025, yearTo: 2026, engine: '1.6T' }]
    }))
  }, 409);
  assert.equal(mismatch.data.error, 'PRODUCT_FITMENT_BRAND_MODEL_MISMATCH');

  await json('/api/catalog/products', {
    method: 'POST', headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify(productPayload(productBId, `S3B-${suffix}`, `s3-b-${suffix}`, {
      complementPartIds: [productAId]
    }))
  }, 201);

  const categoryDeleteBlocked = await json<{ error: string }>(`/api/catalog/categories/${categoryId}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  }, 409);
  assert.equal(categoryDeleteBlocked.data.error, 'CATEGORY_IN_USE');

  const modelDeleteBlocked = await json<{ error: string }>(`/api/vehicles/models/${encodeURIComponent(modelId)}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  }, 409);
  assert.equal(modelDeleteBlocked.data.error, 'VEHICLE_MODEL_IN_USE');

  const brandDeleteBlocked = await json<{ error: string }>(`/api/vehicles/brands/${encodeURIComponent(brandId)}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  }, 409);
  assert.equal(brandDeleteBlocked.data.error, 'VEHICLE_BRAND_IN_USE');

  const [storedRows] = await pool.query<Array<RowDataPacket & { data_json: any; fitments_json: any }>>(
    'SELECT data_json, fitments_json FROM products WHERE id = ?', [productAId]
  );
  const staleData = typeof storedRows[0].data_json === 'string' ? JSON.parse(storedRows[0].data_json) : storedRows[0].data_json;
  const staleFitments = typeof storedRows[0].fitments_json === 'string' ? JSON.parse(storedRows[0].fitments_json) : storedRows[0].fitments_json;
  staleData.nameFa = 'STALE JSON NAME';
  staleData.price = 1;
  staleData.categorySlug = 'stale-category';
  staleFitments[0].brandName = 'STALE BRAND';
  staleFitments[0].modelName = 'STALE MODEL';
  await pool.execute(
    'UPDATE products SET data_json = ?, fitments_json = ? WHERE id = ?',
    [JSON.stringify(staleData), JSON.stringify(staleFitments), productAId]
  );

  const canonicalRead = await json<{ product: any }>(`/api/catalog/products/${encodeURIComponent(productAId)}`);
  assert.equal(canonicalRead.data.product.nameFa, `محصول تست S3A-${suffix}`);
  assert.equal(Number(canonicalRead.data.product.price), 1_500_000);
  assert.equal(canonicalRead.data.product.categorySlug, categorySlug);
  assert.equal(canonicalRead.data.product.fitments[0].brandName, 'برند تست مرحله سه');
  assert.equal(canonicalRead.data.product.fitments[0].modelName, 'مدل تست مرحله سه');

  const audit = await json<{ issues: Array<{ code: string; productId?: string }> }>('/api/catalog/integrity', {
    headers: sameOriginHeaders(adminCookie)
  });
  assert(audit.data.issues.some(issue => issue.code === 'PRODUCT_SQL_JSON_DRIFT' && issue.productId === productAId));

  const bulk = await json<{ products: any[] }>('/api/catalog/products/bulk', {
    method: 'PATCH', headers: sameOriginHeaders(adminCookie),
    body: JSON.stringify({ updates: [{ id: productAId, price: 1_234_567, stock: 8 }] })
  });
  const bulkProduct = bulk.data.products.find(item => item.id === productAId);
  assert(bulkProduct, 'Bulk response did not return the canonical saved product.');
  assert.equal(Number(bulkProduct.price), 1_234_567);
  assert.equal(Number(bulkProduct.stock), 8);

  await json(`/api/catalog/products/${encodeURIComponent(productAId)}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  });

  const productBAfterCleanup = await json<{ product: any }>(`/api/catalog/products/${encodeURIComponent(productBId)}`);
  assert.equal(productBAfterCleanup.data.product.complementPartIds.includes(productAId), false, 'Deleting a product left an orphan cross-product reference.');

  await json(`/api/catalog/products/${encodeURIComponent(productBId)}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  });
  await json(`/api/vehicles/models/${encodeURIComponent(modelId)}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  });
  await json(`/api/vehicles/brands/${encodeURIComponent(brandId)}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  });
  await json(`/api/catalog/categories/${categoryId}`, {
    method: 'DELETE', headers: sameOriginHeaders(adminCookie)
  });

  console.log('v30.10.2 stage 3 data architecture/integrity smoke passed.');
};

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
