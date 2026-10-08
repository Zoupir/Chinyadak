import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const finalChecks = [
  ['src/types/index.ts', 'export interface PageFormConfig {'],
  ['src/server/routes/engagement.ts', 'const PART_REQUEST_STATUSES = ['],
  ['src/server/routes/engagement.ts', "'/part-requests/:id',"],
  ['src/context/StoreContext.tsx', 'const updatePartRequest = async'],
  ['src/context/StoreContext.tsx', 'updatePage: (page: SitePage) => Promise<boolean>;'],
  ['src/components/parts/PartRequestView.tsx', 'PartRequestViewProfessional'],
  ['src/components/admin/AdminPagesTab.tsx', '<AdminRequestPageSettings page={selectedPage} />'],
  ['src/components/admin/AdminDashboardPro.tsx', "['جدید','در حال بررسی'].includes(request.status)"]
];

const hasChecks = checks => checks.every(([path, marker]) => {
  try {
    return fs.readFileSync(path, 'utf8').includes(marker);
  } catch {
    return false;
  }
});

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

// npm scripts call prepare:source more than once during CI (lint + build).
// Once the generated source is already at the final contract, do not rerun old
// migrations and risk older repair scripts rewriting the newer implementation.
if (hasChecks(finalChecks)) {
  console.log('Source preparation already at v30.9.0; verified and skipped legacy transforms.');
  process.exit(0);
}

for (const script of [
  'scripts/prepare-source.mjs',
  'scripts/apply-v3082-admin-requests-richtext.mjs',
  'scripts/repair-v3082-generated-source.mjs',
  'scripts/apply-v3090-professional-builder.mjs',
  'scripts/repair-v3090-dashboard.mjs'
]) {
  run(script);
}

if (!hasChecks(finalChecks)) {
  const missing = finalChecks.filter(([path, marker]) => {
    try { return !fs.readFileSync(path, 'utf8').includes(marker); }
    catch { return true; }
  });
  throw new Error('v30.9.0 preparation incomplete: ' + missing.map(([path, marker]) => `${path} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.9.0.');
