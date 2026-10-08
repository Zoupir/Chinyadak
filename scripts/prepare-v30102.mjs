import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

const has = (file, marker) => {
  try { return fs.readFileSync(file, 'utf8').includes(marker); }
  catch { return false; }
};

run('scripts/prepare-v30101.mjs');
run('scripts/apply-v30102-data-integrity.mjs');

const checks = [
  ['src/server/data-integrity.ts', 'canonicalProductDto'],
  ['src/server/data-integrity.ts', 'canonicalizeProductReferences'],
  ['src/server/data-integrity.ts', 'collectProductReferenceUsage'],
  ['src/server/routes/catalog.ts', "catalogRouter.get('/integrity'"],
  ['src/server/routes/catalog.ts', 'PRODUCT_CANONICAL_COLUMNS'],
  ['src/server/routes/catalog.ts', 'canonicalizeProductReferences(product, refs'],
  ['src/server/routes/catalog.ts', 'CATEGORY_IN_USE'],
  ['src/server/routes/vehicles.ts', 'canonicalBrandDto'],
  ['src/server/routes/vehicles.ts', 'VEHICLE_BRAND_IN_USE'],
  ['src/server/routes/vehicles.ts', 'VEHICLE_MODEL_IN_USE'],
  ['src/server/routes/bulk.ts', 'PRODUCT_REFERENCED_BY_OTHER_PRODUCTS'],
  ['src/server/routes/bulk.ts', 'BRAND_HAS_MODELS_USE_INDIVIDUAL_ACTION'],
  ['src/context/StoreContext.tsx', 'data-v30102-vehicle-state-reconcile'],
  ['src/context/StoreContext.tsx', 'const byId = new Map(saved.map(product => [product.id, product]))'],
  ['scripts/reconcile-v30102-data.ts', 'v30.10.2 data reconciliation']
];

const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) {
  throw new Error('v30.10.2 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.10.2 stage 3 data architecture cleanup.');
