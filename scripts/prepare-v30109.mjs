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

run('scripts/prepare-v30108.mjs');
run('scripts/apply-v30109-product-editor-live-save.mjs');

const checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-quill-rich-editor="30.10.9"'],
  ['src/components/common/RichTextComposer.tsx', "from 'quill'"],
  ['src/components/common/RichTextComposer.tsx', 'getSemanticHTML'],
  ['src/components/admin/AdminView.tsx', 'data-view-product-button="1"'],
  ['src/components/admin/AdminView.tsx', 'fixed inset-x-0 top-16 bottom-0'],
  ['src/components/common/LiveSectionModal.tsx', 'data-live-section-save="1"'],
  ['src/server/ssr-store-context.tsx', 'data-v30109-public-admin-session'],
  ['src/server/ssr-store-context.tsx', 'const persistPublicPage = async'],
  ['src/components/common/RichTextEditor.css', 'v30.10.9 Quill editor']
];
const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) throw new Error('v30.10.9 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.version !== '30.10.9') throw new Error(`Expected package version 30.10.9, got ${pkg.version}`);
if (!pkg.dependencies?.quill) throw new Error('Quill dependency missing.');
console.log('Source preparation completed at v30.10.9 product editor / Quill / live-save hotfix.');
