import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Assigns every request a correlation ID — reused from the caller's
 * `X-Request-Id` header when present (so a request can be traced across
 * services), or generated fresh otherwise. The ID is:
 *   - attached to `req.id` for every downstream handler/middleware,
 *   - echoed back on the response so the caller can correlate logs,
 *   - included in every structured log line for this request (see
 *     `request-logger.middleware.ts` and `error-handler.middleware.ts`).
 *
 * Must be registered before any other middleware that logs.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();

  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
