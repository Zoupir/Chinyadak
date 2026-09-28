import { randomUUID } from 'crypto';
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes(),
    files: 1,
    fields: 10
  }
});

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
    const relativeDir = path.posix.join(year, month, category);
    const targetDir = path.join(uploadDirectory(), year, month, category);
    await fs.mkdir(targetDir, { recursive: true });

    const filename = `${randomUUID()}.${detected.extension}`;
    const targetPath = path.join(targetDir, filename);
    await fs.writeFile(targetPath, req.file.buffer, { flag: 'wx' });

    const url = `/uploads/${relativeDir}/${filename}`;
    res.status(201).json({
      url,
      mime: detected.mime,
      size: req.file.size,
      originalName: req.file.originalname
    });
  }
);
