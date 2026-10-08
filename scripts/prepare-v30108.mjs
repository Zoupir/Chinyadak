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
if (pkg.version !== '30.10.8') throw new Error(`Expected package version 30.10.8, got ${pkg.version}`);
for (const name of Object.keys(pkg.dependencies || {})) {
  if (name.startsWith('@tiptap/')) throw new Error(`Tiptap dependency remained after editor replacement: ${name}`);
}
console.log('Source preparation completed at v30.10.8 product-editor + stable WYSIWYG hotfix.');
