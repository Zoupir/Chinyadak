import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../auth';
import { maxUploadBytes, uploadDirectory } from '../media';

type SupportedImage = {
  extension: 'jpg' | 'png' | 'webp' | 'gif';
  mime: string;
};

const detectImageType = (buffer: Buffer): SupportedImage | null => {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return { extension: 'jpg', mime: 'image/jpeg' };

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))
  ) return { extension: 'png', mime: 'image/png' };

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return { extension: 'webp', mime: 'image/webp' };

  if (
    buffer.length >= 6 &&
    ['GIF87a','GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))
  ) return { extension: 'gif', mime: 'image/gif' };

  return null;
};

const preserveOriginalFilename = (originalName: string, detected: SupportedImage): string | null => {
  const decoded = String(originalName || '').normalize('NFC');
  if (!decoded || decoded.length > 240) return null;
  if (/[\u0000-\u001f\u007f]/.test(decoded)) return null;
  if (decoded.includes('/') || decoded.includes('\\') || decoded === '.' || decoded === '..') return null;

  const ext = path.extname(decoded).slice(1).toLowerCase();
  const equivalent =
    detected.extension === 'jpg'
      ? ['jpg', 'jpeg']
      : [detected.extension];

  if (!equivalent.includes(ext)) return null;
  return decoded;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes(),
    files: 1,
    fields: 10
  }
});


type MediaSeoMeta = {
  alt: string;
  title: string;
  caption: string;
  description: string;
  originalName?: string;
};

type MediaListItem = {
  url: string;
  relativePath: string;
  filename: string;
  extension: string;
  category: string;
  year: string;
  month: string;
  folderPath: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  seo: MediaSeoMeta;
};

const defaultSeoFromFilename = (filename: string): MediaSeoMeta => {
  const base = path.basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    alt: base,
    title: base,
    caption: '',
    description: ''
  };
};

const mediaMetaPath = (imagePath: string) => imagePath + '.meta.json';

const readMediaSeo = async (imagePath: string, filename: string): Promise<MediaSeoMeta> => {
  const fallback = defaultSeoFromFilename(filename);
  try {
    const raw = await fs.readFile(mediaMetaPath(imagePath), 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return {
      ...fallback,
      alt: String(parsed.alt ?? fallback.alt),
      title: String(parsed.title ?? fallback.title),
      caption: String(parsed.caption ?? ''),
      description: String(parsed.description ?? ''),
      originalName: parsed.originalName ? String(parsed.originalName) : undefined
    };
  } catch {
    return fallback;
  }
};

const writeMediaSeo = async (imagePath: string, meta: Partial<MediaSeoMeta>, filename: string) => {
  const current = await readMediaSeo(imagePath, filename);
  const safe: MediaSeoMeta = {
    alt: String(meta.alt ?? current.alt).trim().slice(0, 300),
    title: String(meta.title ?? current.title).trim().slice(0, 300),
    caption: String(meta.caption ?? current.caption).trim().slice(0, 1000),
    description: String(meta.description ?? current.description).trim().slice(0, 5000),
    originalName: String(meta.originalName ?? current.originalName ?? '').trim().slice(0, 500) || undefined
  };
  await fs.writeFile(mediaMetaPath(imagePath), JSON.stringify(safe, null, 2), 'utf8');
  return safe;
};

const parseMediaFolder = (relativePath: string) => {
  const parts = relativePath.split('/').filter(Boolean);
  const legacyYearFirst = /^\d{4}$/.test(parts[0] || '');
  const category = legacyYearFirst ? (parts[2] || 'general') : (parts[0] || 'general');
  const year = legacyYearFirst ? (parts[0] || '') : (parts[1] || '');
  const month = legacyYearFirst ? (parts[1] || '') : (parts[2] || '');
  return {
    category,
    year,
    month,
    folderPath: [category, year, month].filter(Boolean).join('/')
  };
};

const listMediaFiles = async (): Promise<MediaListItem[]> => {
  const root = uploadDirectory();
  const items: MediaListItem[] = [];

  const walk = async (dir: string, relative = ''): Promise<void> => {
    let entries: import('fs').Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const rel = path.posix.join(relative.split(path.sep).join('/'), entry.name);
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
        continue;
      }
      if (!entry.isFile() || !/\.(?:jpe?g|png|webp|gif)$/i.test(entry.name)) continue;
      try {
        const stat = await fs.stat(full);
        const folder = parseMediaFolder(rel);
        const seo = await readMediaSeo(full, entry.name);
        items.push({
          url: '/uploads/' + rel,
          relativePath: rel,
          filename: entry.name,
          extension: path.extname(entry.name).slice(1).toLowerCase(),
          category: folder.category,
          year: folder.year,
          month: folder.month,
          folderPath: folder.folderPath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          modifiedAt: stat.mtime.toISOString(),
          seo
        });
      } catch {}
    }
  };

  await walk(root);
  return items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
};

const safeMediaPath = (relativePath: string): string | null => {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || !/\.(?:jpe?g|png|webp|gif)$/i.test(normalized)) return null;
  const root = path.resolve(uploadDirectory());
  const target = path.resolve(root, normalized);
  if (target === root || !target.startsWith(root + path.sep)) return null;
  return target;
};

export const mediaRouter = Router();

mediaRouter.post(
  '/image',
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    if (!req.file?.buffer?.length) {
      res.status(400).json({ error: 'IMAGE_FILE_REQUIRED' });
      return;
    }

    const detected = detectImageType(req.file.buffer);
    if (!detected) {
      res.status(415).json({ error: 'IMAGE_FORMAT_NOT_ALLOWED' });
      return;
    }

    const category = String(req.body?.category || 'general')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 40) || 'general';

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    // WordPress-style hierarchy under each main media folder:
    // /uploads/{category}/{year}/{month}/{file}
    const relativeDir = path.posix.join(category, year, month);
    const targetDir = path.join(uploadDirectory(), category, year, month);
    await fs.mkdir(targetDir, { recursive: true });

    const filename = preserveOriginalFilename(req.file.originalname, detected);
    if (!filename) {
      res.status(400).json({ error: 'MEDIA_FILENAME_INVALID_OR_EXTENSION_MISMATCH' });
      return;
    }

    const targetPath = path.join(targetDir, filename);
    try {
      // Never rename the user's file. If the exact same filename already exists
      // in the same category/year/month folder, reject instead of appending a suffix.
      await fs.writeFile(targetPath, req.file.buffer, { flag: 'wx' });
    } catch (error: any) {
      if (error?.code === 'EEXIST') {
        res.status(409).json({
          error: 'MEDIA_FILENAME_EXISTS',
          filename,
          message: 'A file with the exact same name already exists in this folder.'
        });
        return;
      }
      throw error;
    }

    const originalBase = path.basename(req.file.originalname, path.extname(req.file.originalname))
      .trim();
    const seo = await writeMediaSeo(targetPath, {
      alt: originalBase,
      title: originalBase,
      originalName: req.file.originalname
    }, filename);

    const url = `/uploads/${relativeDir}/${filename}`;
    res.status(201).json({
      url,
      mime: detected.mime,
      size: req.file.size,
      originalName: req.file.originalname,
      category,
      year,
      month,
      folderPath: relativeDir,
      seo
    });
  }
);


mediaRouter.get('/library', requireAdmin, async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim().toLowerCase();
  const year = String(req.query.year || '').trim();
  const month = String(req.query.month || '').trim();
  const limit = Math.max(1, Math.min(2000, Number(req.query.limit || 500)));
  const offset = Math.max(0, Number(req.query.offset || 0));

  const all = await listMediaFiles();
  const filtered = all.filter(item => {
    if (category && category !== 'all' && item.category !== category) return false;
    if (year && year !== 'all' && item.year !== year) return false;
    if (month && month !== 'all' && item.month !== month) return false;
    if (
      q &&
      !item.filename.toLowerCase().includes(q) &&
      !item.relativePath.toLowerCase().includes(q) &&
      !item.category.toLowerCase().includes(q) &&
      !item.seo.alt.toLowerCase().includes(q) &&
      !item.seo.title.toLowerCase().includes(q) &&
      !item.seo.caption.toLowerCase().includes(q)
    ) return false;
    return true;
  });

  const folderMap = new Map<string, { category: string; year: string; month: string; count: number }>();
  for (const item of all) {
    const key = [item.category, item.year, item.month].join('/');
    const current = folderMap.get(key);
    if (current) current.count += 1;
    else folderMap.set(key, { category: item.category, year: item.year, month: item.month, count: 1 });
  }

  res.json({
    total: filtered.length,
    items: filtered.slice(offset, offset + limit),
    categories: Array.from(new Set(all.map(item => item.category))).filter(Boolean).sort(),
    years: Array.from(new Set(all.map(item => item.year))).filter(Boolean).sort().reverse(),
    months: Array.from(new Set(all.map(item => item.month))).filter(Boolean).sort(),
    folders: Array.from(folderMap.values()).sort((a, b) =>
      a.category.localeCompare(b.category) || b.year.localeCompare(a.year) || b.month.localeCompare(a.month)
    )
  });
});

mediaRouter.put('/library/meta', requireAdmin, async (req, res) => {
  const relativePath = String(req.body?.relativePath || '');
  const target = safeMediaPath(relativePath);
  if (!target) {
    res.status(400).json({ error: 'MEDIA_PATH_INVALID' });
    return;
  }
  try {
    await fs.access(target);
  } catch {
    res.status(404).json({ error: 'MEDIA_NOT_FOUND' });
    return;
  }

  const filename = path.basename(target);
  const seo = await writeMediaSeo(target, {
    alt: req.body?.alt,
    title: req.body?.title,
    caption: req.body?.caption,
    description: req.body?.description
  }, filename);

  res.json({ ok: true, seo });
});

mediaRouter.delete('/library', requireAdmin, async (req, res) => {
  const relativePath = String(req.body?.relativePath || '');
  const target = safeMediaPath(relativePath);
  if (!target) {
    res.status(400).json({ error: 'MEDIA_PATH_INVALID' });
    return;
  }
  try {
    await fs.unlink(target);
    await fs.unlink(mediaMetaPath(target)).catch(() => undefined);
    res.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'MEDIA_NOT_FOUND' });
      return;
    }
    throw error;
  }
});
