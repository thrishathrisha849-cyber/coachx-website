import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../auth/token.util';

/**
 * Verifies the `Authorization: Bearer <token>` access token and attaches
 * the authenticated identity to `req.user`. Every protected route MUST
 * use this middleware — Constitution Article I / 001 FR-087: "hiding a
 * UI control on the frontend MUST NOT be treated as a security control."
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(AppError.unauthorized('Authentication required'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, sessionId: claims.sid, roles: claims.roles };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Best-effort variant — attaches `req.user` if a valid token is present,
 * but never rejects the request. Not currently used by any Phase 4 route
 * (every auth-adjacent endpoint here is either fully public or fully
 * protected) but provided as shared infrastructure for a future
 * optionally-authenticated route.
 */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const claims = verifyAccessToken(header.slice('Bearer '.length).trim());
    req.user = { id: claims.sub, sessionId: claims.sid, roles: claims.roles };
  } catch {
    // Ignore — this is best-effort, an invalid token just means "anonymous."
  }
  next();
}
