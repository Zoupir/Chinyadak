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

const checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-quill-rich-editor="30.10.9"'],
  ['src/components/common/RichTextComposer.tsx', "await import('quill')"],
  ['src/components/common/RichTextComposer.tsx', "import './quill-vendor.css'"],
  ['src/components/common/RichTextComposer.tsx', 'getSemanticHTML'],
  ['src/components/admin/AdminView.tsx', 'data-view-product-button="1"'],
  ['src/components/admin/AdminView.tsx', 'fixed inset-x-0 top-16 bottom-0'],
  ['src/components/common/LiveSectionModal.tsx', 'data-live-section-save="1"'],
  ['src/server/ssr-store-context.tsx', 'data-v30109-public-admin-session'],
  ['src/server/ssr-store-context.tsx', 'data-v30109-live-edit-session'],
  ['src/server/ssr-store-context.tsx', 'const persistPublicPage = async'],
  ['src/components/admin/AdminPagesTab.tsx', 'data-v30109-admin-live-edit-session'],
  ['src/components/common/RichTextEditor.css', 'v30.10.9 Quill editor']
];
const isPrepared = () => checks.every(([file, marker]) => has(file, marker));

// Older preparation stages intentionally enforce their historical editor
// implementation. Once 30.10.9 has replaced it with Quill, re-running the old
// chain would overwrite or reject the final source. Build/lint call
// prepare:source repeatedly, so verify-and-skip on an already prepared tree.
if (!isPrepared()) {
  run('scripts/prepare-v30108.mjs');
  run('scripts/apply-v30109-product-editor-live-save.mjs');
  run('scripts/repair-v30109-generated.mjs');
} else {
  console.log('Source preparation already at v30.10.9; legacy editor transforms skipped.');
}
run('scripts/repair-v30109-e2e.mjs');

// Do not let the Node SSR bundle retain a runtime import of
// node_modules/quill/dist/quill.snow.css. Build tools already handle local CSS
// imports safely, so copy the exact pinned Quill theme into a local generated
// stylesheet before every typecheck/build invocation.
const quillCssSource = 'node_modules/quill/dist/quill.snow.css';
const quillCssTarget = 'src/components/common/quill-vendor.css';
if (!fs.existsSync(quillCssSource)) throw new Error('Quill Snow CSS is missing from node_modules; run npm install first.');
fs.copyFileSync(quillCssSource, quillCssTarget);
if (!fs.readFileSync(quillCssTarget, 'utf8').includes('.ql-container')) throw new Error('Vendored Quill stylesheet is incomplete.');

const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) throw new Error('v30.10.9 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
if (!has('scripts/test-e2e.cjs', 'data-v30109-live-save-e2e')) throw new Error('v30.10.9 theme-aware live-save E2E marker missing.');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.version !== '30.10.9') throw new Error(`Expected package version 30.10.9, got ${pkg.version}`);
if (pkg.dependencies?.quill !== '2.0.2') throw new Error(`Expected Quill 2.0.2, got ${pkg.dependencies?.quill || 'missing'}`);
console.log('Source preparation completed at v30.10.9 product editor / Quill / live-save hotfix.');
