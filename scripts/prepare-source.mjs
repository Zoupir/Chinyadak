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

const hasChecks = checks => checks.every(([path, marker]) => {
  try { return fs.readFileSync(path, 'utf8').includes(marker); }
  catch { return false; }
});

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

// lint and build run in the same checkout. Once the newest markers exist,
// leave the migrated source alone instead of replaying older migrations.
if (hasChecks(v3052Checks)) {
  console.log('Source preparation already at v30.5.2; verified.');
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

run('scripts/apply-v3052-footer-copyright.mjs');

if (!hasChecks(v3052Checks)) throw new Error('Source preparation did not reach v30.5.2 markers.');
console.log('Source preparation completed at v30.5.2.');
