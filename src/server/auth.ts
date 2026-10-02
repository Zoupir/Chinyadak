import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { pool, type RowDataPacket } from './db';

export type AuthRole = 'customer' | 'admin';

export interface SessionPayload extends JwtPayload {
  sub: string;
  role: AuthRole;
  ver: number;
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

const sessionCookieMaxAgeMs = (): number => {
  const raw = String(config.jwtExpiresIn || '7d').trim().toLowerCase();
  if (/^\d+$/.test(raw)) return Math.max(60, Number(raw)) * 1000;
  const match = raw.match(/^(\d+(?:\.\d+)?)(s|m|h|d|w)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const multiplier =
    match[2] === 's' ? 1000 :
    match[2] === 'm' ? 60 * 1000 :
    match[2] === 'h' ? 60 * 60 * 1000 :
    match[2] === 'd' ? 24 * 60 * 60 * 1000 :
    7 * 24 * 60 * 60 * 1000;
  return Math.max(60_000, Math.round(amount * multiplier));
};

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
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionCookieMaxAgeMs()
  });
};

export const clearSession = (res: Response): void => {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/'
  });
};

interface SessionSubjectRow extends RowDataPacket {
  session_version: number;
  is_active?: number;
  status?: string;
}

const isSessionSubjectValid = async (payload: SessionPayload): Promise<boolean> => {
  const table = payload.role === 'admin' ? 'admin_users' : 'customers';
  const [rows] = await pool.query<SessionSubjectRow[]>(
    payload.role === 'admin'
      ? `SELECT session_version, is_active FROM ${table} WHERE id = ? LIMIT 1`
      : `SELECT session_version, status FROM ${table} WHERE id = ? LIMIT 1`,
    [payload.sub]
  );
  const row = rows[0];
  if (!row || Number(row.session_version) !== Number(payload.ver)) return false;
  return payload.role === 'admin' ? Boolean(row.is_active) : row.status === 'active';
};

const decodeSession = (req: Request): SessionPayload | null => {
  const token = req.cookies?.[config.sessionCookieName];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: 'chinpart',
      audience: 'chinpart-web'
    }) as SessionPayload;
    if (!payload.sub || !payload.role || !Number.isInteger(Number(payload.ver))) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getOptionalSession = async (req: Request): Promise<SessionPayload | null> => {
  const payload = decodeSession(req);
  if (!payload) return null;
  return (await isSessionSubjectValid(payload)) ? payload : null;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const payload = decodeSession(req);
  if (!payload) {
    clearSession(res);
    res.status(401).json({ error: 'AUTH_REQUIRED' });
    return;
  }

  try {
    if (!(await isSessionSubjectValid(payload))) {
      clearSession(res);
      res.status(401).json({ error: 'INVALID_SESSION' });
      return;
    }
    req.auth = payload;
    next();
  } catch (error) {
    next(error);
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
