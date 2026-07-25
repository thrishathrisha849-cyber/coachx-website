import type { NextFunction, Request, Response } from 'express';

/**
 * Cache-Control for public, CMS-driven read endpoints (Phase 5 Part 2
 * §"PERFORMANCE": "cache headers"). A short, safe `max-age` — content
 * is admin-managed and doesn't need sub-minute freshness, but should
 * still reflect a publish/update within about a minute rather than
 * being cached indefinitely. `stale-while-revalidate` lets a shared
 * cache serve a slightly-stale response instantly while refetching in
 * the background, rather than every client blocking on a fresh fetch
 * the moment the cache expires.
 *
 * `Vary: Authorization` is set because some of these routes
 * (`/navigation/:location`, `/pages/:slug`) use `authenticateOptional`
 * and are structurally ready to return a different (permission-
 * filtered) result depending on the caller's identity (see
 * docs/public-site/TRACEABILITY.md's FR-007 note) — a shared cache
 * (CDN/proxy) must not serve one user's cached response to another
 * user with different credentials, even though every caller is
 * evaluated as a guest today.
 */
export function cacheControl(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.setHeader('Vary', 'Authorization');
  next();
}
