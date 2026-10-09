import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const engineFile = 'src/server/audit/site-audit.ts';
const source = fs.readFileSync(engineFile, 'utf8');
const match = source.match(/const ENGINE_VERSION = ['"]([^'"]+)['"]/);
const version = match?.[1] || '';

if (/^2\.[1-9]\./.test(version) || /^2\.[1-9]$/.test(version)) {
  console.log(`Site Auditor ${version} already includes v2.1 baseline; skipped legacy v2.1 patch.`);
  process.exit(0);
}

const result = spawnSync(process.execPath, ['scripts/apply-site-auditor-v210.mjs'], {
  stdio: 'inherit',
  env: process.env
});
if (result.error) throw result.error;
process.exit(result.status || 0);
