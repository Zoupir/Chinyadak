import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const sourcePath = 'scripts/apply-v30103-cms-editor.mjs';
let source = fs.readFileSync(sourcePath, 'utf8');

// The stage patch intentionally emits SQL template literals into cms.ts. Those
// literals live inside a generator template literal, so escape their delimiters
// before Node parses the generator itself. The repaired generator is written
// back into the prepared workspace so TypeScript can also parse every script.
const escapeGeneratedSqlTemplate = (label, sqlStart, sqlEnd) => {
  const start = source.indexOf(sqlStart);
  if (start < 0) {
    // Already repaired on an earlier prepare:source pass.
    const escapedStart = sqlStart.replace('`', '\\`');
    if (source.includes(escapedStart)) return;
    throw new Error(`v30.10.3 runner could not find ${label} SQL start`);
  }
  const end = source.indexOf(sqlEnd, start + sqlStart.length);
  if (end < 0) throw new Error(`v30.10.3 runner could not find ${label} SQL end`);
  const segmentEnd = end + sqlEnd.length;
  const segment = source.slice(start, segmentEnd);
  const escaped = segment.replace(/`/g, '\\`');
  source = source.slice(0, start) + escaped + source.slice(segmentEnd);
};

escapeGeneratedSqlTemplate(
  'page update',
  '          `UPDATE site_pages',
  '           WHERE id = ?`'
);
escapeGeneratedSqlTemplate(
  'page insert',
  '          `INSERT INTO site_pages',
  '           VALUES (?, ?, ?, ?, ?)`'
);

fs.writeFileSync(sourcePath, source);
const tempPath = path.join(os.tmpdir(), `apply-v30103-cms-editor-${process.pid}.mjs`);
fs.writeFileSync(tempPath, source);
try {
  const result = spawnSync(process.execPath, [tempPath], { stdio: 'inherit', cwd: process.cwd() });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
} finally {
  fs.rmSync(tempPath, { force: true });
}
