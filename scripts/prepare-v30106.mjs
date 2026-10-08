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

run('scripts/prepare-v30105.mjs');
run('scripts/repair-v30106-transform.mjs');
run('scripts/apply-v30106-performance.mjs');

const checks = [
  ['src/App.tsx', "const AdminView = lazy(() => import('./components/admin/AdminView')"],
  ['src/App.tsx', 'ensureSiteFontLoaded(settings.fontFamily'],
  ['src/components/search/SearchAutocomplete.tsx', 'role="combobox"'],
  ['src/components/layout/Header.tsx', 'marketplace-category-mega'],
  ['src/components/layout/Header.tsx', 'aria-modal="true"'],
  ['src/components/product/ProductCard.tsx', 'decoding="async"'],
  ['server.ts', 'max-age=31536000, immutable'],
  ['src/index.css', 'v30.10.6 accessibility/performance'],
  ['src/public-hydrate.tsx', "await import('./components/product/ProductDetailView')"],
  ['scripts/build-server.mjs', 'splitting: true'],
  ['src/utils/siteFont.ts', 'ensureSiteFontLoaded'],
  ['index.html', '<meta name="theme-color"']
];
const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) {
  throw new Error('v30.10.6 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}
console.log('Source preparation completed at v30.10.6 stage 7 performance, UX and accessibility.');
