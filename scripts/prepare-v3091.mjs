import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

// Build the known-good v30.9.0 generated source first, then apply the editor
// integration and storefront rendering fixes as two narrow, idempotent stages.
run('scripts/prepare-v3090.mjs');
run('scripts/apply-v3091-editor-core.mjs');
run('scripts/apply-v3091-rich-rendering.mjs');

const checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-rich-composer-version="30.9.1"'],
  ['src/components/common/RichTextComposer.tsx', 'internalEmissionRef.current === incomingHtml'],
  ['src/components/common/RichTextComposer.tsx', 'runWithSavedSelection'],
  ['src/utils/richText.ts', "safe.push('text-align:' + align + '!important')"],
  ['src/components/page/PageView.tsx', '<RichTextContent content={section.content}'],
  ['src/components/page/PageView.tsx', '<RichTextContent content={item.content}'],
  ['src/components/layout/Footer.tsx', 'data-footer-rich-text="30.9.1"'],
  ['src/index.css', '/* v30.9.1 footer rich alignment */'],
  ['src/components/admin/AdminFooterTab.tsx', 'const handleSaveAll = async () =>']
];

const missing = checks.filter(([path, marker]) => {
  try { return !fs.readFileSync(path, 'utf8').includes(marker); }
  catch { return true; }
});
if (missing.length) {
  throw new Error('v30.9.1 preparation incomplete: ' + missing.map(([path, marker]) => `${path} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.9.1.');
