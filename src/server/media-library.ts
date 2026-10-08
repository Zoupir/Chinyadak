import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { uploadDirectory } from './media';
import { decodeMultipartFilename, publicUploadUrl } from './media-filenames';

export type MediaKind = 'image' | 'audio' | 'video';

export interface MediaVariant {
  width: number;
  height?: number;
  format: 'webp';
  size: number;
  relativePath: string;
  url: string;
}

export interface MediaSeoMeta {
  alt: string;
  title: string;
  caption: string;
  description: string;
  originalName?: string;
  mime?: string;
  kind?: MediaKind;
  width?: number;
  height?: number;
  variants?: MediaVariant[];
}

export interface MediaLibraryItem {
  url: string;
  thumbnailUrl: string;
  relativePath: string;
  filename: string;
  extension: string;
  kind: MediaKind;
  category: string;
  year: string;
  month: string;
  folderPath: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  width?: number;
  height?: number;
  variants: MediaVariant[];
  seo: MediaSeoMeta;
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogv', 'mov']);
const CACHE_TTL_MS = Math.max(5_000, Math.min(120_000, Number(process.env.MEDIA_LIBRARY_CACHE_MS || 30_000)));
const VARIANT_WIDTHS = [320, 768, 1280] as const;

let libraryCache: { expiresAt: number; items: MediaLibraryItem[] } | null = null;
let cacheGeneration = 0;

export const invalidateMediaLibraryCache = () => {
  libraryCache = null;
  cacheGeneration += 1;
};

export const mediaKindFromFilename = (filename: string): MediaKind | null => {
  const extension = path.extname(filename).slice(1).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return null;
};

export const mediaMetaPath = (targetPath: string) => targetPath + '.meta.json';

const defaultSeoFromFilename = (filename: string, kind: MediaKind): MediaSeoMeta => {
  const base = path.basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    alt: kind === 'image' ? base : '',
    title: base,
    caption: '',
    description: '',
    kind
  };
};

export const readMediaMeta = async (
  targetPath: string,
  filename: string,
  kind: MediaKind
): Promise<MediaSeoMeta> => {
  const fallback = defaultSeoFromFilename(filename, kind);
  try {
    const raw = await fs.readFile(mediaMetaPath(targetPath), 'utf8');
    const parsed = JSON.parse(raw || '{}');
    const variants = Array.isArray(parsed.variants)
      ? parsed.variants.filter((item: any) => item && item.relativePath && item.url && Number(item.width) > 0)
      : [];
    return {
      ...fallback,
      alt: String(parsed.alt ?? fallback.alt),
      title: String(parsed.title ?? fallback.title),
      caption: String(parsed.caption ?? ''),
      description: String(parsed.description ?? ''),
      originalName: parsed.originalName ? String(parsed.originalName) : undefined,
      mime: parsed.mime ? String(parsed.mime) : undefined,
      kind: parsed.kind === 'audio' || parsed.kind === 'video' || parsed.kind === 'image' ? parsed.kind : kind,
      width: Number(parsed.width) > 0 ? Number(parsed.width) : undefined,
      height: Number(parsed.height) > 0 ? Number(parsed.height) : undefined,
      variants
    };
  } catch {
    return fallback;
  }
};

export const writeMediaMeta = async (
  targetPath: string,
  meta: Partial<MediaSeoMeta>,
  filename: string,
  kind: MediaKind
): Promise<MediaSeoMeta> => {
  const current = await readMediaMeta(targetPath, filename, kind);
  const safe: MediaSeoMeta = {
    alt: String(meta.alt ?? current.alt).trim().slice(0, 300),
    title: String(meta.title ?? current.title).trim().slice(0, 300),
    caption: String(meta.caption ?? current.caption).trim().slice(0, 1000),
    description: String(meta.description ?? current.description).trim().slice(0, 5000),
    originalName: String(meta.originalName ?? current.originalName ?? '').trim().slice(0, 500) || undefined,
    mime: String(meta.mime ?? current.mime ?? '').trim().slice(0, 120) || undefined,
    kind,
    width: Number(meta.width ?? current.width) > 0 ? Number(meta.width ?? current.width) : undefined,
    height: Number(meta.height ?? current.height) > 0 ? Number(meta.height ?? current.height) : undefined,
    variants: Array.isArray(meta.variants) ? meta.variants : current.variants || []
  };
  await fs.writeFile(mediaMetaPath(targetPath), JSON.stringify(safe, null, 2), 'utf8');
  invalidateMediaLibraryCache();
  return safe;
};

const variantDirectoryName = (filename: string) => `${filename}.variants`;

export const generateResponsiveImageVariants = async (
  targetPath: string,
  relativePath: string,
  filename: string
): Promise<{ width?: number; height?: number; variants: MediaVariant[] }> => {
  const extension = path.extname(filename).slice(1).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension) || extension === 'gif') return { variants: [] };

  try {
    const metadata = await sharp(targetPath, { failOn: 'none' }).metadata();
    const originalWidth = Number(metadata.width || 0) || undefined;
    const originalHeight = Number(metadata.height || 0) || undefined;
    const targetDir = path.join(path.dirname(targetPath), variantDirectoryName(filename));
    const relativeDir = path.posix.join(path.posix.dirname(relativePath), variantDirectoryName(filename));
    await fs.mkdir(targetDir, { recursive: true });

    const widths = VARIANT_WIDTHS.filter(width => !originalWidth || width <= originalWidth);
    if (!widths.length && originalWidth) widths.push(Math.max(1, Math.min(320, originalWidth)) as 320);
    const variants: MediaVariant[] = [];
    for (const width of widths) {
      const outputName = `w${width}.webp`;
      const outputPath = path.join(targetDir, outputName);
      const info = await sharp(targetPath, { failOn: 'none' })
        .rotate()
        .resize({ width, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: width <= 320 ? 78 : 82, effort: 4 })
        .toFile(outputPath);
      const variantRelativePath = path.posix.join(relativeDir, outputName);
      variants.push({
        width: info.width,
        height: info.height,
        format: 'webp',
        size: info.size,
        relativePath: variantRelativePath,
        url: publicUploadUrl(variantRelativePath)
      });
    }
    return { width: originalWidth, height: originalHeight, variants };
  } catch (error) {
    console.warn('Responsive image variant generation skipped:', filename, error instanceof Error ? error.message : error);
    return { variants: [] };
  }
};

export const deleteMediaVariants = async (targetPath: string, filename: string) => {
  await fs.rm(path.join(path.dirname(targetPath), variantDirectoryName(filename)), { recursive: true, force: true }).catch(() => undefined);
};

export const safeMediaPath = (relativePath: string): string | null => {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.split('/').some(segment => segment.startsWith('.'))) return null;
  if (!mediaKindFromFilename(normalized)) return null;
  const root = path.resolve(uploadDirectory());
  const target = path.resolve(root, normalized);
  if (target === root || !target.startsWith(root + path.sep)) return null;
  return target;
};

const parseMediaFolder = (relativePath: string, kind: MediaKind) => {
  const parts = relativePath.split('/').filter(Boolean);
  const legacyYearFirst = /^\d{4}$/.test(parts[0] || '');
  if (legacyYearFirst) {
    return {
      category: parts[2] || 'general',
      year: parts[0] || '',
      month: parts[1] || '',
      folderPath: [parts[2] || 'general', parts[0] || '', parts[1] || ''].filter(Boolean).join('/')
    };
  }
  if ((parts[1] === 'audio' || parts[1] === 'video') && kind === parts[1]) {
    return {
      category: parts[0] || 'editor-media',
      year: parts[2] || '',
      month: parts[3] || '',
      folderPath: [parts[0] || 'editor-media', kind, parts[2] || '', parts[3] || ''].filter(Boolean).join('/')
    };
  }
  return {
    category: parts[0] || 'general',
    year: parts[1] || '',
    month: parts[2] || '',
    folderPath: [parts[0] || 'general', parts[1] || '', parts[2] || ''].filter(Boolean).join('/')
  };
};

const scanMediaFiles = async (): Promise<MediaLibraryItem[]> => {
  const root = uploadDirectory();
  const items: MediaLibraryItem[] = [];

  const walk = async (dir: string, relative = ''): Promise<void> => {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(entries.map(async entry => {
      if (entry.name.endsWith('.meta.json') || entry.name.endsWith('.variants')) return;
      const rel = path.posix.join(relative.split(path.sep).join('/'), entry.name);
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
        return;
      }
      if (!entry.isFile()) return;
      const kind = mediaKindFromFilename(entry.name);
      if (!kind) return;
      try {
        const stat = await fs.stat(full);
        const displayName = decodeMultipartFilename(entry.name);
        const meta = await readMediaMeta(full, displayName, kind);
        const folder = parseMediaFolder(rel, kind);
        const variants = meta.variants || [];
        const thumbnail = kind === 'image'
          ? variants.slice().sort((a, b) => a.width - b.width)[0]?.url || publicUploadUrl(rel)
          : publicUploadUrl(rel);
        items.push({
          url: publicUploadUrl(rel),
          thumbnailUrl: thumbnail,
          relativePath: rel,
          filename: displayName,
          extension: path.extname(displayName).slice(1).toLowerCase(),
          kind,
          category: folder.category,
          year: folder.year,
          month: folder.month,
          folderPath: folder.folderPath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          modifiedAt: stat.mtime.toISOString(),
          width: meta.width,
          height: meta.height,
          variants,
          seo: meta
        });
      } catch {
        // A concurrently removed file should not fail the full media listing.
      }
    }));
  };

  await walk(root);
  return items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
};

export const getMediaLibraryItems = async (force = false): Promise<MediaLibraryItem[]> => {
  const now = Date.now();
  if (!force && libraryCache && libraryCache.expiresAt > now) return libraryCache.items;
  const generationBefore = cacheGeneration;
  const items = await scanMediaFiles();
  if (generationBefore === cacheGeneration) libraryCache = { items, expiresAt: now + CACHE_TTL_MS };
  return items;
};

export const registerUploadedMedia = async (options: {
  targetPath: string;
  relativePath: string;
  filename: string;
  kind: MediaKind;
  mime?: string;
}) => {
  const base = path.basename(options.filename, path.extname(options.filename)).trim();
  const variantData = options.kind === 'image'
    ? await generateResponsiveImageVariants(options.targetPath, options.relativePath, options.filename)
    : { variants: [] as MediaVariant[] };
  const meta = await writeMediaMeta(options.targetPath, {
    alt: options.kind === 'image' ? base : '',
    title: base,
    originalName: options.filename,
    mime: options.mime,
    width: variantData.width,
    height: variantData.height,
    variants: variantData.variants
  }, options.filename, options.kind);
  invalidateMediaLibraryCache();
  return meta;
};
