import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../auth';
import { uploadDirectory } from '../media';
import { decodeMultipartFilename, publicUploadUrl } from '../media-filenames';

type RichMediaKind = 'audio' | 'video';

const allowedByKind: Record<RichMediaKind, Record<string, string[]>> = {
  audio: {
    mp3: ['audio/mpeg', 'audio/mp3'],
    wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
    ogg: ['audio/ogg', 'application/ogg'],
    m4a: ['audio/mp4', 'audio/x-m4a'],
    aac: ['audio/aac', 'audio/x-aac']
  },
  video: {
    mp4: ['video/mp4', 'application/mp4'],
    webm: ['video/webm'],
    ogv: ['video/ogg', 'application/ogg'],
    mov: ['video/quicktime']
  }
};

const maxRichMediaBytes = (): number => {
  const configured = Number(process.env.MAX_RICH_MEDIA_MB || 96);
  const mb = Number.isFinite(configured) ? Math.max(8, Math.min(512, configured)) : 96;
  return Math.floor(mb * 1024 * 1024);
};

const looksLikeAllowedMedia = (buffer: Buffer, extension: string, kind: RichMediaKind): boolean => {
  if (!buffer.length) return false;
  const head = buffer.subarray(0, Math.min(buffer.length, 64));
  const ascii = head.toString('ascii');
  if (kind === 'audio') {
    if (extension === 'mp3') return ascii.startsWith('ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    if (extension === 'wav') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE';
    if (extension === 'ogg') return ascii.startsWith('OggS');
    if (extension === 'm4a') return ascii.includes('ftyp');
    if (extension === 'aac') return buffer[0] === 0xff && (buffer[1] & 0xf0) === 0xf0;
  } else {
    if (extension === 'mp4' || extension === 'mov') return ascii.includes('ftyp');
    if (extension === 'webm') return buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    if (extension === 'ogv') return ascii.startsWith('OggS');
  }
  return false;
};

const safeUploadedFilename = (rawName: unknown, kind: RichMediaKind, mime: string, buffer: Buffer): string | null => {
  const filename = decodeMultipartFilename(rawName).trim();
  if (!filename || filename.length > 240) return null;
  if (/[\u0000-\u001f\u007f]/u.test(filename) || /[\u202A-\u202E\u2066-\u2069]/u.test(filename)) return null;
  if (filename.includes('/') || filename.includes('\\') || filename === '.' || filename === '..') return null;
  const extension = path.extname(filename).slice(1).toLowerCase();
  const acceptedMimes = allowedByKind[kind][extension];
  if (!acceptedMimes?.includes(String(mime || '').toLowerCase())) return null;
  return looksLikeAllowedMedia(buffer, extension, kind) ? filename : null;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxRichMediaBytes(), files: 1, fields: 8 }
});

export const richMediaRouter = Router();

richMediaRouter.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  const kind = String(req.body?.kind || '') as RichMediaKind;
  if (!['audio', 'video'].includes(kind)) {
    res.status(400).json({ error: 'RICH_MEDIA_KIND_INVALID' });
    return;
  }
  if (!req.file?.buffer?.length) {
    res.status(400).json({ error: 'RICH_MEDIA_FILE_REQUIRED' });
    return;
  }

  const filename = safeUploadedFilename(req.file.originalname, kind, req.file.mimetype, req.file.buffer);
  if (!filename) {
    res.status(415).json({ error: kind === 'video' ? 'VIDEO_FORMAT_NOT_ALLOWED' : 'AUDIO_FORMAT_NOT_ALLOWED' });
    return;
  }

  const rawCategory = String(req.body?.category || 'editor-media').toLowerCase();
  const category = rawCategory.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'editor-media';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const relativeDir = path.posix.join(category, kind, year, month);
  const targetDir = path.join(uploadDirectory(), category, kind, year, month);
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, filename);

  try {
    await fs.writeFile(targetPath, req.file.buffer, { flag: 'wx' });
  } catch (error: any) {
    if (error?.code === 'EEXIST') {
      res.status(409).json({ error: 'MEDIA_FILENAME_EXISTS', filename });
      return;
    }
    throw error;
  }

  const relativePath = path.posix.join(relativeDir, filename);
  res.status(201).json({
    url: publicUploadUrl(relativePath),
    relativePath,
    kind,
    mime: req.file.mimetype,
    size: req.file.size,
    originalName: filename
  });
});
