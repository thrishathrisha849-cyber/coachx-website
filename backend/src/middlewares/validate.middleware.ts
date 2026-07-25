import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/app-error';

/**
 * Generic request-validation middleware built on Zod (the project's
 * existing validation standard — used by `env.config.ts` since Phase 1).
 * Validates `{ body, params, query }` together against one schema and
 * replaces `req.body`/`req.params`/`req.query` with the parsed
 * (trimmed/coerced/defaulted) result, so downstream handlers only ever
 * see already-validated data.
 */
export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });

    if (!result.success) {
      next(AppError.badRequest('Request validation failed', result.error.flatten()));
      return;
    }

    const parsed = result.data as { body?: unknown; params?: unknown; query?: unknown };
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
    if (parsed.query !== undefined) Object.assign(req.query, parsed.query);

    next();
  };
}
