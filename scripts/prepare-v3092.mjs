import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

run('scripts/prepare-v3091.mjs');
run('scripts/normalize-v3092-pre.mjs');
run('scripts/apply-v3092-editor-pages-live-save.mjs');
run('scripts/repair-v3092-final.mjs');

const checks = [
  ['src/context/StoreContext.tsx', 'data-v3092-product-save'],
  ['src/context/StoreContext.tsx', 'Promise<Product | null>'],
  ['src/context/StoreContext.tsx', 'data-v3092-article-save'],
  ['src/context/StoreContext.tsx', "const discountMode: NonNullable<Product['discountMode']> = updated.discountMode || 'none'"],
  ['src/utils/pricing.ts', '!hasExplicitDiscountMode && legacy > 0'],
  ['src/components/admin/AdminView.tsx', 'data-product-editor-page={isStandaloneProductEditor'],
  ['src/components/admin/AdminView.tsx', '/admin/product-edit/'],
  ['src/components/admin/AdminArticlesTab.tsx', 'data-article-editor-shell="1"'],
  ['src/components/admin/AdminArticlesTab.tsx', '/admin/article-edit/'],
  ['src/components/common/LiveSectionModal.tsx', 'nextPlacements = resolved.map'],
  ['src/components/common/LiveSectionModal.tsx', "{isSaving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}"],
  ['src/index.css', '/* v30.9.2 standalone admin editors */']
];

const missing = checks.filter(([path, marker]) => {
  try { return !fs.readFileSync(path, 'utf8').includes(marker); }
  catch { return true; }
});
if (missing.length) {
  throw new Error('v30.9.2 preparation incomplete: ' + missing.map(([path, marker]) => `${path} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.9.2.');
