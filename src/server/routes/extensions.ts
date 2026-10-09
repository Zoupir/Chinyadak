import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { requireAdminPermission } from '../auth';
import {
  getPublicExtensionState,
  installExtensionZip,
  listExtensions,
  removeExtension,
  resolveExtensionAsset,
  rollbackExtension,
  setExtensionEnabled
} from '../extensions/manager';
import type { ExtensionKind } from '../extensions/types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 }
});

const kindFrom = (value: unknown): ExtensionKind => {
  if (value === 'plugin' || value === 'theme') return value;
  throw new Error('EXTENSION_KIND_INVALID');
};

const statusForError = (message: string): number => {
  if (/NOT_FOUND|ROLLBACK_NOT_AVAILABLE/.test(message)) return 404;
  if (/INCOMPATIBLE/.test(message)) return 409;
  if (/TOO_LARGE|LIMIT_EXCEEDED|TOO_MANY/.test(message)) return 413;
  return 400;
};

const errorPayload = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'EXTENSION_ERROR';
  const [code, detail] = message.split(':', 2);
  return { status: statusForError(code), body: { error: code || 'EXTENSION_ERROR', detail: detail || undefined } };
};

export const extensionsRouter = Router();

extensionsRouter.get('/public', async (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await getPublicExtensionState());
  } catch (error) {
    next(error);
  }
});

extensionsRouter.get('/assets/:kind/:id/*', async (req, res) => {
  try {
    const kind = kindFrom(req.params.kind);
    const relativePath = String(req.params[0] || '');
    const assetPath = await resolveExtensionAsset(kind, String(req.params.id), relativePath);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(path.resolve(assetPath));
  } catch (error) {
    const payload = errorPayload(error);
    res.status(payload.status).json(payload.body);
  }
});

extensionsRouter.get('/', requireAdminPermission('canManageSettings'), async (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await listExtensions());
  } catch (error) {
    next(error);
  }
});

extensionsRouter.post('/install', requireAdminPermission('canManageSettings'), upload.single('file'), async (req, res) => {
  try {
    const kind = kindFrom(req.body?.kind ?? req.query.kind);
    if (!req.file?.buffer) {
      res.status(400).json({ error: 'EXTENSION_ZIP_REQUIRED' });
      return;
    }
    if (!String(req.file.originalname || '').toLowerCase().endsWith('.zip')) {
      res.status(400).json({ error: 'EXTENSION_ZIP_REQUIRED' });
      return;
    }
    const installed = await installExtensionZip(req.file.buffer, kind);
    res.status(201).json({ extension: installed });
  } catch (error) {
    const payload = errorPayload(error);
    res.status(payload.status).json(payload.body);
  }
});

extensionsRouter.post('/:kind/:id/activate', requireAdminPermission('canManageSettings'), async (req, res) => {
  try {
    const kind = kindFrom(req.params.kind);
    await setExtensionEnabled(kind, req.params.id, true);
    res.json({ ok: true });
  } catch (error) {
    const payload = errorPayload(error);
    res.status(payload.status).json(payload.body);
  }
});

extensionsRouter.post('/:kind/:id/deactivate', requireAdminPermission('canManageSettings'), async (req, res) => {
  try {
    const kind = kindFrom(req.params.kind);
    await setExtensionEnabled(kind, req.params.id, false);
    res.json({ ok: true });
  } catch (error) {
    const payload = errorPayload(error);
    res.status(payload.status).json(payload.body);
  }
});

extensionsRouter.post('/:kind/:id/rollback', requireAdminPermission('canManageSettings'), async (req, res) => {
  try {
    const kind = kindFrom(req.params.kind);
    await rollbackExtension(kind, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    const payload = errorPayload(error);
    res.status(payload.status).json(payload.body);
  }
});

extensionsRouter.delete('/:kind/:id', requireAdminPermission('canManageSettings'), async (req, res) => {
  try {
    const kind = kindFrom(req.params.kind);
    await removeExtension(kind, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    const payload = errorPayload(error);
    res.status(payload.status).json(payload.body);
  }
});
