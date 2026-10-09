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

run('scripts/prepare-v30107.mjs');
run('scripts/repair-v30108-hotfix-transform.mjs');
run('scripts/repair-v30108-wysiwyg-template.mjs');
run('scripts/repair-v30108-selectall.mjs');
run('scripts/repair-v30108-fragment-styles.mjs');
run('scripts/apply-v30108-editor-hotfix.mjs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const checks = [
  ['src/components/admin/AdminView.tsx', 'data-v30108-product-loader'],
  ['src/components/admin/AdminView.tsx', 'data-product-editor-loading="1"'],
  ['src/components/common/RichTextComposer.tsx', 'data-stable-rich-editor="30.10.8"'],
  ['src/components/common/RichTextComposer.tsx', "document.execCommand('styleWithCSS'"],
  ['src/components/common/RichTextComposer.tsx', 'const applyInlineStyle ='],
  ['src/components/common/RichTextComposer.tsx', "applyInlineStyle({ fontWeight: '700' })"],
  ['src/components/common/RichTextComposer.tsx', 'range.selectNodeContents(root);'],
  ['src/components/common/RichTextComposer.tsx', 'const fragment = range.extractContents();'],
  ['src/components/common/RichTextComposer.tsx', 'element.style.setProperty(propertyNames[key]'],
  ['src/components/common/RichTextComposer.tsx', 'onPaste={onPaste}'],
  ['src/utils/richText.ts', 'font-family:'],
  ['src/utils/richText.ts', 'line-height:'],
  ['src/components/common/RichTextEditor.css', 'v30.10.8 stable editor']
];
const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) {
  throw new Error('v30.10.8 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}
const versionParts = String(pkg.version || '').split('.').map(Number);
const supportsV30108Preparation = versionParts.length === 3
  && versionParts.every(Number.isFinite)
  && (versionParts[0] > 30
    || (versionParts[0] === 30 && versionParts[1] > 10)
    || (versionParts[0] === 30 && versionParts[1] === 10 && versionParts[2] >= 8));
if (!supportsV30108Preparation) {
  throw new Error(`Expected package version 30.10.8 or later, got ${pkg.version}`);
}
for (const name of Object.keys(pkg.dependencies || {})) {
  if (name.startsWith('@tiptap/')) throw new Error(`Tiptap dependency remained after editor replacement: ${name}`);
}
console.log(`Source preparation completed with v30.10.8 product-editor + stable WYSIWYG hotfix on core ${pkg.version}.`);
