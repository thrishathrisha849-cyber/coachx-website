import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import { roleHasPermission } from '../auth/rbac.service';

/**
 * Authorization middlewares (001 FR-084–FR-089). MUST run after
 * `authenticate` (reads `req.user`). Deny-by-default: a missing
 * `req.user`, an unrecognized role, or a permission not granted to any
 * of the user's roles all deny the request — there is no fallback-allow
 * path (Phase 4 brief §10).
 */

/** Denies unless the authenticated user holds at least one of the given permissions. */
export function requirePermission(...permissionKeys: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    const allowed = permissionKeys.some((key) => roleHasPermission(req.user!.roles, key));
    if (!allowed) {
      // 001 FR-089: specific denial reason, never a generic 403.
      next(AppError.forbidden('permission denied'));
      return;
    }

    next();
  };
}

/** Denies unless the authenticated user holds at least one of the given roles. */
export function requireRole(...roleNames: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    const allowed = req.user.roles.some((role) => roleNames.includes(role));
    if (!allowed) {
      next(AppError.forbidden('permission denied'));
      return;
    }

    next();
  };
}
