import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Lightweight structured request/response logger. Logs once per request,
 * after the response has finished, with method/path/status/duration and
 * the request's correlation ID (see `request-id.middleware.ts`, which
 * must run before this) for cross-log-line tracing.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`, {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    });
  });

  next();
}
