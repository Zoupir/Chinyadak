import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pool } from '../src/server/db';

const base = String(process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.match(String(pkg.version || ''), /^30\.10\.(?:[7-9]|[1-9]\d+)$/);
const prepareSource = String(pkg.scripts?.['prepare:source'] || '');
const legacyPrepare = /^node scripts\/prepare-v3010[7-9]\.mjs(?: && node scripts\/prepare-extension-platform\.mjs)?$/.test(prepareSource);
const tracedPrepare = prepareSource === 'node scripts/run-prepare-source.mjs';
assert.ok(legacyPrepare || tracedPrepare, `Unexpected prepare:source pipeline: ${prepareSource}`);
if (legacyPrepare && prepareSource.includes('prepare-extension-platform.mjs')) {
  assert.ok(fs.existsSync('scripts/prepare-extension-platform.mjs'), 'Extension source preparation script is missing.');
}
if (tracedPrepare) {
  for (const required of [
    'scripts/run-prepare-source.mjs',
    'scripts/pipeline-trace-hook.mjs',
    'scripts/pipeline-trace-lib.mjs',
    'scripts/prepared-audit-inventory.mjs',
    'scripts/prepare-v30108.mjs',
    'scripts/prepare-extension-platform.mjs',
    'scripts/apply-site-auditor-v210.mjs'
  ]) {
    assert.ok(fs.existsSync(required), `Traced prepare pipeline dependency is missing: ${required}`);
  }
}
assert.equal(pkg.devDependencies?.autoprefixer, undefined);
assert.match(String(pkg.dependencies?.multer || ''), /2\.4/);
assert.match(String(pkg.overrides?.protobufjs || ''), /7\.6\.5/);
assert.match(String(pkg.overrides?.ws || ''), /8\.20\.1/);

const trackedLock = execFileSync('git', ['ls-files', 'package-lock.json'], { encoding: 'utf8' }).trim();
assert.equal(trackedLock, '', 'package-lock.json must not be committed for the current DirectAdmin deployment contract.');

execFileSync(process.execPath, ['scripts/audit-release.mjs'], { stdio: 'inherit' });

const request = async (pathname: string, expected = 200) => {
  const response = await fetch(base + pathname, { redirect: 'manual' });
  const body = await response.text();
  assert.equal(response.status, expected, `${pathname}: expected ${expected}, got ${response.status}: ${body.slice(0, 240)}`);
  return { response, body };
};

const run = async () => {
  const health = await request('/api/health');
  const healthJson = JSON.parse(health.body) as { ok?: boolean; database?: string };
  assert.equal(healthJson.ok, true);
  assert.equal(healthJson.database, 'connected');

  const home = await request('/');
  assert.match(home.body, /data-react-ssr="1"/);
  assert.match(home.body, /\/assets\/public-hydrate\.js/);
  assert.equal(home.response.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(home.response.headers.get('content-security-policy'), 'CSP header is missing.');
  assert.ok(home.response.headers.get('referrer-policy'), 'Referrer-Policy header is missing.');

  const productsResponse = await request('/api/catalog/products');
  const products = (JSON.parse(productsResponse.body) as { products: any[] }).products;
  const product = products.find(item => item?.slug) || products[0];
  assert.ok(product?.slug, 'No product with a slug is available for final route audit.');
  const productPage = await request(`/product/${encodeURIComponent(product.slug)}`);
  assert.match(productPage.body, /rel="canonical"/);
  assert.match(productPage.body, /"@type":"Product"/);
  assert.match(productPage.body, /data-react-ssr="1"/);

  const categoriesResponse = await request('/api/catalog/categories');
  const categories = (JSON.parse(categoriesResponse.body) as { categories: any[] }).categories;
  const category = categories.find(item => item?.slug) || categories[0];
  assert.ok(category?.slug, 'No category slug is available for final route audit.');
  const categoryPage = await request(`/category/${encodeURIComponent(category.slug)}`);
  assert.match(categoryPage.body, /rel="canonical"/);
  assert.match(categoryPage.body, /data-react-ssr="1"/);

  await request('/api/orders', 401);
  await request('/api/integrations', 401);

  const publicEntry = await request('/assets/public-hydrate.js');
  assert.match(publicEntry.response.headers.get('content-type') || '', /javascript/);

  const chunkDir = path.resolve('dist/assets/public-chunks');
  const chunkName = fs.readdirSync(chunkDir).find(name => name.endsWith('.js'));
  assert.ok(chunkName, 'No public JavaScript chunk exists.');
  const chunk = await request('/assets/public-chunks/' + chunkName);
  const cache = chunk.response.headers.get('cache-control') || '';
  assert.match(cache, /max-age=31536000/);
  assert.match(cache, /immutable/);

  console.log(`v${pkg.version} cumulative release smoke passed.`);
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end().catch(() => undefined);
});
