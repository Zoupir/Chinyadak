import fs from 'node:fs/promises';
import path from 'node:path';
import { pool, type RowDataPacket } from '../src/server/db';
import { uploadDirectory } from '../src/server/media';
import {
  partRequestPrivateDirectory,
  partRequestPrivateUrl
} from '../src/server/private-files';

interface RequestRow extends RowDataPacket {
  id: string;
  data_json: any;
}

const parseJson = (value: unknown): Record<string, any> => {
  if (value && typeof value === 'object') return value as Record<string, any>;
  try {
    return JSON.parse(String(value || '{}')) as Record<string, any>;
  } catch {
    return {};
  }
};

const exists = async (file: string): Promise<boolean> => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const moveFile = async (source: string, target: string): Promise<void> => {
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    await fs.rename(source, target);
  } catch (error: any) {
    if (error?.code !== 'EXDEV') throw error;
    await fs.copyFile(source, target);
    await fs.unlink(source);
  }
};

const [rows] = await pool.query<RequestRow[]>(
  "SELECT id, data_json FROM part_requests WHERE CAST(data_json AS CHAR) LIKE '%/uploads/part-requests/%'"
);

let migrated = 0;
let missing = 0;
for (const row of rows) {
  const data = parseJson(row.data_json);
  const oldUrl = String(data.imageUrl || '');
  const prefix = '/uploads/part-requests/';
  if (!oldUrl.startsWith(prefix)) continue;

  const relative = oldUrl.slice(prefix.length).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!relative || relative.includes('..') || !/\.(?:jpe?g|png|webp|gif)$/i.test(relative)) continue;

  const source = path.resolve(uploadDirectory(), 'part-requests', relative);
  const privateRoot = path.resolve(partRequestPrivateDirectory());
  const target = path.resolve(privateRoot, relative);
  if (!target.startsWith(privateRoot + path.sep)) continue;

  const targetExists = await exists(target);
  const sourceExists = await exists(source);
  if (!targetExists && sourceExists) await moveFile(source, target);

  if (!(await exists(target))) {
    missing += 1;
    continue;
  }

  data.imageUrl = partRequestPrivateUrl(relative);
  data.imageAttached = true;
  await pool.execute(
    'UPDATE part_requests SET data_json = ?, updated_at = NOW() WHERE id = ?',
    [JSON.stringify(data), row.id]
  );
  migrated += 1;
}

console.log(`Private part-request attachment migration: ${migrated} migrated, ${missing} missing source files.`);
await pool.end();
