import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

// First guarantee the complete v30.9.0 contract, then apply the focused rich
// editor/rendering fix. Both scripts are idempotent and safe across lint/build.
run('scripts/prepare-v3090.mjs');
run('scripts/apply-v3091-editor-reliability.mjs');

const checks = [
  ['src/components/common/RichTextComposer.tsx', 'data-rich-composer-version="30.9.1"'],
  ['src/components/common/RichTextComposer.tsx', 'internalEmissionRef.current === incomingHtml'],
  ['src/utils/richText.ts', "text-align:' + align[1].toLowerCase() + '!important'"],
  ['src/components/page/PageView.tsx', '<RichTextContent content={section.content}'],
  ['src/components/page/PageView.tsx', '<RichTextContent content={item.content}'],
  ['src/components/layout/Footer.tsx', 'data-footer-rich-text="30.9.1"'],
  ['src/index.css', 'data-bottom-align="right"] .marketplace-ref-footer-copyright'],
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
