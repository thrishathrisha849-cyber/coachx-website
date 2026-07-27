import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { generateSitemapXml, generateRobotsTxt, resolveRedirect } from './seo.service';

function baseUrlFromRequest(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] ?? req.protocol;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  return `${protocol}://${host}`;
}

/** GET /sitemap.xml — 002 FR-092. Server-rendered, no client JS involved. */
export const getSitemap = asyncHandler(async (req: Request, res: Response) => {
  const xml = await generateSitemapXml(baseUrlFromRequest(req));
  res.status(200).type('application/xml').send(xml);
});

/** GET /robots.txt — 002 FR-092. */
export const getRobotsTxt = asyncHandler(async (req: Request, res: Response) => {
  const txt = generateRobotsTxt(baseUrlFromRequest(req));
  res.status(200).type('text/plain').send(txt);
});

/**
 * GET /api/v1/cms/redirects/check?path=/old-slug — 002 FR-092 ("manage
 * redirects, including 301 support"), completed in Phase 5 Part 2.
 *
 * Consulted by the frontend's `CmsPageRoute` when a page lookup 404s,
 * BEFORE rendering the 404 page — the SPA architecture means there is
 * no server-side URL rewrite step the way a traditional server-rendered
 * app would have, so the redirect check happens as an explicit extra
 * API call on the 404 path rather than transparently at the HTTP layer.
 */
export const checkRedirect = asyncHandler(async (req: Request, res: Response) => {
  const path = req.query.path as string;
  const redirect = await resolveRedirect(path);

  if (!redirect) throw AppError.notFound('No redirect configured for this path');

  res.status(200).json(buildSuccessResponse(redirect));
});
