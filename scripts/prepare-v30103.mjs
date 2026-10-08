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

run('scripts/prepare-v30102.mjs');
run('scripts/run-v30103-cms-editor.mjs');
run('scripts/repair-v30103-generated-source.mjs');

const checks = [
  ['src/types/index.ts', 'cmsRevision?: number;'],
  ['src/context/StoreContext.tsx', 'const discardSectionPreview ='],
  ['src/context/StoreContext.tsx', 'const addProduct = async'],
  ['src/context/StoreContext.tsx', 'const updateArticle = async'],
  ['src/context/StoreContext.tsx', 'const updatePage = (updatedPage: SitePage): Promise<boolean>'],
  ['src/server/routes/cms.ts', 'CMS_PAGE_REVISION_CONFLICT'],
  ['src/server/routes/cms.ts', 'normalizePageForSave'],
  ['src/components/common/LiveSectionModal.tsx', "mode?: 'edit' | 'create'"],
  ['src/components/common/LiveSectionModal.tsx', 'useDialogFocusTrap'],
  ['src/components/admin/AdminPagesTab.tsx', 'handleDropSection'],
  ['src/components/admin/AdminPagesTab.tsx', '<LiveSectionModal'],
  ['src/components/admin/AdminArticlesTab.tsx', 'closeArticleEditor'],
  ['src/components/admin/AdminView.tsx', 'closeProductEditor'],
  ['src/hooks/useEditorGuard.ts', 'useUnsavedChangesGuard']
];

const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) {
  throw new Error('v30.10.3 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.10.3 stage 4 CMS/admin/live-editor stability.');
