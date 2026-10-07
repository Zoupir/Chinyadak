import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const markerChecks = [
  ['src/utils/navigation.ts', "if (view === 'admin') return param ? `/admin/${encodeURIComponent(param)}` : '/admin';"],
  ['src/components/admin/AdminView.tsx', 'const resolvedTarget = (() => {'],
  ['src/components/layout/Footer.tsx', 'className="footer-copyright-rich"'],
  ['src/server/ssr-store-context.tsx', 'const removeFromGarage = (id: string) => {']
];

const prepared = () => markerChecks.every(([path, marker]) => {
  try { return fs.readFileSync(path, 'utf8').includes(marker); }
  catch { return false; }
});

const run = (script) => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

// npm run lint and npm run build execute in the same checkout in CI. Source
// migrations are intentionally idempotent at the pipeline level: once the
// current-generation markers exist, do not feed the already-migrated files
// back through older normalization scripts.
if (prepared()) {
  run('scripts/repair-v3051-generated-source.mjs');
  console.log('Source preparation already at v30.5.1; verified.');
  process.exit(0);
}

for (const script of [
  'scripts/pre-v3050-adminview.mjs',
  'scripts/apply-v3050-patches.mjs',
  'scripts/post-v3050-adminview.mjs',
  'scripts/apply-v3051-patches.mjs',
  'scripts/repair-v3051-generated-source.mjs'
]) run(script);

if (!prepared()) throw new Error('Source preparation did not reach v30.5.1 markers.');
console.log('Source preparation completed at v30.5.1.');
