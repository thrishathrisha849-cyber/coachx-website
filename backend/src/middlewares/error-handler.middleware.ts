import type { NextFunction, Request, Response } from 'express';
import { buildErrorResponse, ERROR_CODES, HttpStatus } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { redact } from '../utils/redact';
import { config } from '../config';

/**
 * Single, centralized error-handling middleware. Every error in the
 * request lifecycle — thrown synchronously, rejected in an async
 * handler, or passed to `next(err)` — ends up here exactly once.
 *
 * Must be registered LAST, after all routes and other middleware.
 *
 * Security: the response body NEVER includes a stack trace, and any
 * `details` payload is redacted before being sent — an `AppError`
 * carrying a `password`/`token`/etc. field in its `details` (e.g. from
 * a validation error echoing the request body) will not leak it back to
 * the client. The correlation ID is available to the caller via the
 * `X-Request-Id` response header (set by `request-id.middleware.ts` on
 * every request, including error responses) rather than duplicated into
 * the JSON body.
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
  const code = isAppError ? err.code : ERROR_CODES.INTERNAL_ERROR;
  const message =
    isAppError || config.isDevelopment
      ? (err as Error)?.message ?? 'Unknown error'
      : 'An unexpected error occurred';
  const details = isAppError ? redact(err.details) : undefined;

  const logPayload = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    ...(config.isDevelopment && err instanceof Error ? { stack: err.stack } : {}),
  };

  if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(message, logPayload);
  } else {
    logger.warn(message, logPayload);
  }

  res.status(statusCode).json(buildErrorResponse(String(code), message, details));
}
