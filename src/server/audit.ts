import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth';
import { pool } from './db';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const deriveEntity = (originalUrl: string): { type: string | null; id: string | null } => {
  const path = originalUrl.split('?')[0].replace(/^\/api\//, '');
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { type: null, id: null };

  const type = parts.slice(0, 2).join(':').slice(0, 80) || null;
  const candidate = parts.length > 2 ? parts[2] : null;
  const id = candidate && !['status', 'bulk', 'reorder', 'login', 'logout'].includes(candidate)
    ? candidate.slice(0, 100)
    : null;
  return { type, id };
};

export const auditMutationMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const startedAt = Date.now();
  res.on('finish', () => {
    const actor = req.auth;
    if (!actor || res.statusCode >= 500) return;

    const entity = deriveEntity(req.originalUrl);
    const metadata = {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userAgent: String(req.get('user-agent') || '').slice(0, 500)
    };

    void pool.execute(
      `INSERT INTO audit_log
       (actor_type, actor_id, action_name, entity_type, entity_id, ip_address, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.role,
        actor.sub,
        `${req.method} ${metadata.path}`.slice(0, 120),
        entity.type,
        entity.id,
        String(req.ip || '').slice(0, 64) || null,
        JSON.stringify(metadata)
      ]
    ).catch(error => {
      console.error('Audit log write failed:', error);
    });
  });

  next();
};
