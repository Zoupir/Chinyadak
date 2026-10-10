import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getProductDiscountInfo } from '../src/utils/pricing';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const request = async (path: string, options: RequestInit = {}, expected = 200): Promise<Response> => {
  const response = await fetch(base + path, options);
  if (response.status !== expected) {
    const body = await response.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${path}: expected ${expected}, got ${response.status}: ${body}`);
  }
  return response;
};

const json = async <T>(path: string, options: RequestInit = {}, expected = 200) => {
  const response = await request(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  }, expected);
  return { response, data: await response.json() as T };
};

const cookieFrom = (response: Response) => String(response.headers.get('set-cookie') || '').split(';')[0].trim();

const run = async () => {
  // Pricing regression: explicit modern "none" must ignore a stale legacy value.
  const noDiscount = getProductDiscountInfo({ price: 5_000_000, discountMode: 'none', discountPrice: 1_000_000 });
  assert.equal(noDiscount.effectivePrice, 5_000_000, 'Explicit no-discount still falls back to stale discountPrice.');
  assert.equal(noDiscount.active, false, 'Explicit no-discount is incorrectly marked active.');

  const adminSource = fs.readFileSync('src/components/admin/AdminView.tsx', 'utf8');
  assert.match(adminSource, /\/admin\/product-edit\//, 'Product edit no longer opens a dedicated admin route.');
  assert.match(adminSource, /data-product-editor-page=\{isStandaloneProductEditor/, 'Standalone product editor shell is missing.');
  assert.match(adminSource, /handledProductTargetRef/, 'Product route effect can still reopen stale editor state.');
  assert.match(adminSource, /await updateProduct\(editingProduct\)/, 'Product save is still fire-and-forget.');

  const articlesSource = fs.readFileSync('src/components/admin/AdminArticlesTab.tsx', 'utf8');
  assert.match(articlesSource, /\/admin\/article-edit\//, 'Article edit no longer opens a dedicated admin route.');
  assert.match(articlesSource, /data-article-editor-shell="1"/, 'Standalone article editor shell is missing.');
  assert.match(articlesSource, /handledArticleTargetRef/, 'Article route effect can still reset the form after save.');
  assert.match(articlesSource, /await updateArticle\(/, 'Article save is still fire-and-forget.');

  const liveSource = fs.readFileSync('src/components/common/LiveSectionModal.tsx', 'utf8');
  assert.match(liveSource, /onClick=\{save\} disabled=\{isSaving\}/, 'Live section save button is not active for every section.');
  assert.doesNotMatch(liveSource, /!isBannerSection && <button type="button" onClick=\{save\}/, 'Banner section save is still hidden.');
  assert.match(liveSource, /nextPlacements = resolved\.map/, 'Live banner edits are not synced to canonical banner placements.');
  assert.match(liveSource, /rows=\{8\}/, 'Section rich editor is still the cramped legacy variant.');

  const contextSource = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');
  assert.match(contextSource, /updateProduct: \(updated: Product\) => Promise<Product \| null>/, 'updateProduct contract is not awaitable.');
  assert.match(contextSource, /discountPrice: 0/, 'Product save does not explicitly clear the legacy sale price.');

  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  assert(adminPassword.length >= 10, 'ADMIN_BOOTSTRAP_PASSWORD is required.');
  const login = await json<{ admin: unknown }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: process.env.ADMIN_BOOTSTRAP_USER || 'admin', password: adminPassword })
  });
  const cookie = cookieFrom(login.response);
  assert(cookie, 'Admin session cookie missing.');

  // Round-trip one real seeded product and then restore it. This catches the
  // exact regression where the storefront received new data but price state was
  // inconsistent after an edit.
  const catalog = await json<{ products: any[] }>('/api/catalog/products?limit=1&offset=0');
  assert(catalog.data.products.length > 0, 'No seeded product available for v30.9.2 regression.');
  const original = catalog.data.products[0];
  const changedPrice = Math.max(1, Number(original.price || 0) + 12345);
  const edited = {
    ...original,
    price: changedPrice,
    discountMode: 'none',
    discountValue: 0,
    discountPrice: 0
  };

  const saved = await json<{ product: any }>(`/api/catalog/products/${encodeURIComponent(original.id)}`, {
    method: 'PUT',
    headers: { Cookie: cookie },
    body: JSON.stringify(edited)
  });
  assert.equal(Number(saved.data.product.price), changedPrice, 'Product PUT response returned an old price.');
  assert.equal(Number(saved.data.product.discountPrice || 0), 0, 'Product PUT response retained stale discountPrice.');

  const fetched = await json<{ product: any }>(`/api/catalog/products/${encodeURIComponent(original.id)}`);
  assert.equal(Number(fetched.data.product.price), changedPrice, 'Fresh product GET did not expose the saved price.');
  assert.equal(Number(fetched.data.product.discountPrice || 0), 0, 'Fresh product GET still exposes stale discountPrice.');

  await json<{ product: any }>(`/api/catalog/products/${encodeURIComponent(original.id)}`, {
    method: 'PUT',
    headers: { Cookie: cookie },
    body: JSON.stringify(original)
  });

  console.log('v30.9.2 product price, standalone editor and live-section save regression passed.');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
