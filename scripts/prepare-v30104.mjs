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

run('scripts/prepare-v30103.mjs');
run('scripts/apply-v30104-media.mjs');

const checks = [
  ['src/server/media-library.ts', 'generateResponsiveImageVariants'],
  ['src/server/media-references.ts', "source: 'seo-meta'"],
  ['src/server/routes/media.ts', 'getMediaLibraryItems'],
  ['src/server/routes/media.ts', "MEDIA_FILE_IN_USE"],
  ['src/server/routes/rich-media.ts', 'bufferedInMemory: false'],
  ['src/api/media.ts', 'nextOffset: number | null'],
  ['src/components/admin/AdminMediaLibrary.tsx', 'PAGE_SIZE = 80'],
  ['src/components/common/MediaPickerModal.tsx', "kind: 'image'"],
  ['server.ts', "app.use('/api/rich-media', richMediaRouter);"]
];
const missing = checks.filter(([file, marker]) => !has(file, marker));
if (missing.length) {
  throw new Error('v30.10.4 preparation incomplete: ' + missing.map(([file, marker]) => `${file} :: ${marker}`).join(' | '));
}
console.log('Source preparation completed at v30.10.4 stage 5 media/content hardening.');
