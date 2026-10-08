import path from 'node:path';

const PRIVATE_ROOT = path.resolve(
  process.env.PRIVATE_UPLOAD_DIR || path.join(process.cwd(), 'private-uploads')
);

export const privateUploadDirectory = (): string => PRIVATE_ROOT;

export const partRequestPrivateDirectory = (): string =>
  path.join(PRIVATE_ROOT, 'part-requests');

export const partRequestPrivateUrl = (relativePath: string): string => {
  const normalized = String(relativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const token = Buffer.from(normalized, 'utf8').toString('base64url');
  return `/api/engagement/part-request-files/${token}`;
};

export const resolvePartRequestPrivateToken = (token: string): string | null => {
  let relative = '';
  try {
    relative = Buffer.from(String(token || ''), 'base64url').toString('utf8');
  } catch {
    return null;
  }
  relative = relative.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!relative || relative.includes('..')) return null;
  if (!/\.(?:jpe?g|png|webp|gif)$/i.test(relative)) return null;

  const root = path.resolve(partRequestPrivateDirectory());
  const target = path.resolve(root, relative);
  if (target === root || !target.startsWith(root + path.sep)) return null;
  return target;
};
