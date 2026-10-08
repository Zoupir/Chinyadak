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

run('scripts/prepare-v30104.mjs');
run('scripts/repair-v30105-script.mjs');
run('scripts/apply-v30105-seo.mjs');

const checks = [
  ['server.ts', 'buildPublicSitemapIndexXml'],
  ['server.ts', 'shouldRedirectToCanonicalSeoPath'],
  ['src/server/seo.ts', 'normalizeHreflangEntries'],
  ['src/server/seo.ts', 'LimitedAvailability'],
  ['src/server/seo/platform.ts', 'Cross-entity diversity is intentional'],
  ['src/server/seo/public.ts', 'sitemap-static-1.xml'],
  ['src/server/seo/technical.ts', 'canonicalPublicSeoPath'],
  ['src/components/shop/ShopView.tsx', 'normalizeShopSearch']
];
const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) {
  throw new Error('v30.10.5 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}
console.log('Source preparation completed at v30.10.5 stage 6 technical SEO and URL architecture.');
