import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { config } from './config';

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
    maxAge: 7 * 24 * 60 * 60 * 1000
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
