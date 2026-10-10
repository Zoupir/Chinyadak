import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = script => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

run('scripts/prepare-v3092.mjs');
run('scripts/apply-v30100-security.mjs');

const checks = [
  ['server.ts', 'API_CROSS_SITE_MUTATION_BLOCKED'],
  ['server.ts', 'strict-origin-when-cross-origin'],
  ['src/server/auth.ts', 'ADMIN_SESSION_REVOKED'],
  ['src/server/routes/payments.ts', 'PAYMENT_ORDER_FORBIDDEN'],
  ['src/server/routes/payments.ts', 'PAYMENT_AUTH_REQUIRED'],
  ['src/server/routes/engagement.ts', "engagementRouter.get('/part-request-files/:token'"],
  ['src/server/routes/engagement.ts', 'partRequestPrivateDirectory()'],
  ['src/server/routes/media.ts', 'MEDIA_FILE_IN_USE'],
  ['src/server/routes/media.ts', 'requireMediaAdmin'],
  ['src/server/routes/rich-media.ts', 'multer.diskStorage'],
  ['src/server/routes/rich-media.ts', 'bufferedInMemory: false'],
  ['src/components/layout/Footer.tsx', 'sanitizeTrustedEmbedHtml'],
  ['src/utils/safeEmbedHtml.ts', 'ALLOWED_TAGS'],
  ['src/server/private-files.ts', 'partRequestPrivateUrl'],
  ['src/server/media-references.ts', 'findMediaReferences']
];

const missing = checks.filter(([file, marker]) => {
  try { return !fs.readFileSync(file, 'utf8').includes(marker); }
  catch { return true; }
});

if (missing.length) {
  throw new Error('v30.10.0 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}

console.log('Source preparation completed at v30.10.0 stage 1 hardening.');
