import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { generateSitemapXml, generateRobotsTxt } from './seo.service';

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
