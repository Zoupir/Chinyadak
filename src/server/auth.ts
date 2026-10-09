import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { pool, type RowDataPacket } from './db';

export type AuthRole = 'customer' | 'admin';

export interface SessionPayload extends JwtPayload {
  sub: string;
  role: AuthRole;
  username?: string;
  phone?: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: SessionPayload;
}

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

const sessionCookieSecure = (() => {
  if (config.nodeEnv !== 'production') return false;
  try {
    return new URL(config.appUrl).protocol === 'https:';
  } catch {
    return true;
  }
})();

export const issueSession = (
  res: Response,
  payload: Omit<SessionPayload, 'iat' | 'exp'>
): void => {
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    issuer: 'chinpart',
    audience: 'chinpart-web'
  });

  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    secure: sessionCookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const clearSession = (res: Response): void => {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    secure: sessionCookieSecure,
    sameSite: 'lax',
    path: '/'
  });
};

export const getOptionalSession = (req: Request): SessionPayload | null => {
  const token = req.cookies?.[config.sessionCookieName];
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret, {
      issuer: 'chinpart',
      audience: 'chinpart-web'
    }) as SessionPayload;
  } catch {
    return null;
  }
};

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.[config.sessionCookieName];
  if (!token) {
    res.status(401).json({ error: 'AUTH_REQUIRED' });
    return;
  }

  try {
    req.auth = jwt.verify(token, config.jwtSecret, {
      issuer: 'chinpart',
      audience: 'chinpart-web'
    }) as SessionPayload;
    next();
  } catch {
    clearSession(res);
    res.status(401).json({ error: 'INVALID_SESSION' });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  authenticate(req, res, () => {
    if (req.auth?.role !== 'admin') {
      res.status(403).json({ error: 'ADMIN_REQUIRED' });
      return;
    }
    next();
  });
};

interface AdminPermissionRow extends RowDataPacket {
  role: string;
  permissions_json: string | object | null;
  is_active: number;
}

const parsePermissions = (value: string | object | null): Record<string, boolean> => {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, boolean>;
  try {
    return JSON.parse(value) as Record<string, boolean>;
  } catch {
    return {};
  }
};

export const requireAdminPermission = (permission: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    authenticate(req, res, async () => {
      if (req.auth?.role !== 'admin') {
        res.status(403).json({ error: 'ADMIN_REQUIRED' });
        return;
      }

      try {
        const [rows] = await pool.query<AdminPermissionRow[]>(
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
        if (!permissions[permission]) {
          res.status(403).json({ error: 'ADMIN_PERMISSION_REQUIRED', permission });
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
