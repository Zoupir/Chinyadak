import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const v3051Checks = [
  ['src/utils/navigation.ts', "if (view === 'admin') return param ? `/admin/${encodeURIComponent(param)}` : '/admin';"],
  ['src/components/admin/AdminView.tsx', 'const resolvedTarget = (() => {'],
  ['src/components/layout/Footer.tsx', 'className="footer-copyright-rich"'],
  ['src/server/ssr-store-context.tsx', 'const removeFromGarage = (id: string) => {']
];

const v3052Checks = [
  ['src/types/index.ts', 'footerCopyrightPosition?:'],
  ['src/components/admin/AdminFooterTab.tsx', 'جایگاه کپی‌رایت در عرض فوتر'],
  ['src/components/layout/Footer.tsx', 'marketplace-ref-footer-copyright-row'],
  ['src/index.css', 'v30.5.2 — copyright placement and media controls']
];

const v3053Checks = [
  ['src/components/common/RichTextEditor.tsx', 'data-rich-editor-version="30.5.3"'],
  ['src/components/common/RichTextComposer.tsx', "name: 'richAudio'"],
  ['src/utils/richText.ts', "'IMG', 'AUDIO', 'VIDEO'"],
  ['src/components/common/RichTextEditorEnhancements.css', 'v30.5.3 — rich editor source/media and bold-color fidelity']
];

const v3060Checks = [
  ['src/types/index.ts', 'export interface PartBrand {'],
  ['src/context/StoreContext.tsx', 'const [partBrands, setPartBrands]'],
  ['src/components/admin/ProductClassificationFields.tsx', 'برندهای سازنده قطعه'],
  ['src/components/admin/AdminView.tsx', "id: 'part_brands'"],
  ['src/App.tsx', '<PartBrandDetailView'],
  ['src/server/public-storefront-react.tsx', '<PartBrandDetailView'],
  ['src/server/storefront-html.ts', "entity.type === 'part_brand'"],
  ['src/server/seo/platform.ts', "type === 'part_brand'"],
  ['src/server/seo.ts', "'part-brands': { entityType: 'part_brand'"],
  ['src/components/common/RichTextComposer.tsx', "name: 'richEmbed'"],
  ['src/utils/richText.ts', 'export const safeRichEmbedSrc'],
  ['server.ts', "app.use('/api/rich-media', richMediaRouter)"]
];

const hasChecks = checks => checks.every(([path, marker]) => {
  try { return fs.readFileSync(path, 'utf8').includes(marker); }
  catch { return false; }
});

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

if (hasChecks(v3052Checks) && hasChecks(v3053Checks) && hasChecks(v3060Checks)) {
  run('scripts/repair-v3052-footer.mjs');
  console.log('Source preparation already at v30.6.0; verified.');
  process.exit(0);
}

if (!hasChecks(v3051Checks)) {
  for (const script of [
    'scripts/pre-v3050-adminview.mjs',
    'scripts/apply-v3050-patches.mjs',
    'scripts/post-v3050-adminview.mjs',
    'scripts/apply-v3051-patches.mjs',
    'scripts/repair-v3051-generated-source.mjs'
  ]) run(script);
} else {
  run('scripts/repair-v3051-generated-source.mjs');
}

if (!hasChecks(v3051Checks)) throw new Error('Source preparation did not reach v30.5.1 prerequisite markers.');

if (!hasChecks(v3052Checks)) run('scripts/apply-v3052-footer-copyright.mjs');
run('scripts/repair-v3052-footer.mjs');
if (!hasChecks(v3052Checks)) throw new Error('Source preparation did not reach v30.5.2 markers.');
if (!hasChecks(v3053Checks)) throw new Error('Source preparation did not reach v30.5.3 rich-editor markers.');

if (!hasChecks(v3060Checks)) run('scripts/apply-v3060-part-brands-media.mjs');
if (!hasChecks(v3060Checks)) throw new Error('Source preparation did not reach v30.6.0 part-brand/media markers.');
console.log('Source preparation completed at v30.6.0.');
