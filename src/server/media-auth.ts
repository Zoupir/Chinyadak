import type { NextFunction, Response } from 'express';
import { authenticate, type AuthenticatedRequest } from './auth';
import { pool, type RowDataPacket } from './db';

interface MediaAdminRow extends RowDataPacket {
  role: string;
  permissions_json: string | object | null;
  is_active: number;
}

const MEDIA_PERMISSIONS = [
  'canManageProducts',
  'canManageArticles',
  'canManageSliders',
  'canManageSettings'
] as const;

const parsePermissions = (value: string | object | null): Record<string, boolean> => {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, boolean>;
  try {
    return JSON.parse(value) as Record<string, boolean>;
  } catch {
    return {};
  }
};

/**
 * Media access is intentionally narrower than a generic admin session.
 * Super admins are always allowed; delegated admins must have at least one
 * permission that legitimately requires media management.
 */
export const requireMediaAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  authenticate(req, res, async () => {
    if (req.auth?.role !== 'admin') {
      res.status(403).json({ error: 'ADMIN_REQUIRED' });
      return;
    }

    try {
      const [rows] = await pool.query<MediaAdminRow[]>(
        'SELECT role, permissions_json, is_active FROM admin_users WHERE id = ? LIMIT 1',
        [req.auth.sub]
      );
      const admin = rows[0];
      if (!admin || !admin.is_active) {
        res.status(403).json({ error: 'ADMIN_INACTIVE' });
        return;
      }
      if (admin.role === 'super_admin') {
        next();
        return;
      }

      const permissions = parsePermissions(admin.permissions_json);
      if (!MEDIA_PERMISSIONS.some(permission => permissions[permission])) {
        res.status(403).json({
          error: 'ADMIN_MEDIA_PERMISSION_REQUIRED',
          permissions: MEDIA_PERMISSIONS
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};
