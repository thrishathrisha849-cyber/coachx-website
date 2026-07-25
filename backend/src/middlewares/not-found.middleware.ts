import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

/**
 * Catches any request that didn't match a route and converts it into a
 * standard 404 AppError, forwarded to the global error handler.
 */
export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
