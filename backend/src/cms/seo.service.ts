import { findAllPublishedSlugs, findRedirect } from './cms.repository';

/**
 * Server-side sitemap/robots generation (002 FR-092). Unlike page
 * `<head>` metadata (client-side in this architecture — see
 * docs/public-site/TRACEABILITY.md's architecture-conflict note), this
 * IS genuinely server-rendered: Express generates and serves the XML/
 * text response directly, with no client JS involved. A crawler that
 * never executes JavaScript still gets a correct sitemap.
 */

const LANGUAGE_URL_PREFIX: Record<string, string> = { EN: 'en', TA: 'ta', TANGLISH: 'ta' };

export async function generateSitemapXml(baseUrl: string): Promise<string> {
  const pages = await findAllPublishedSlugs();

  const urls = pages
    .map((p) => {
      const prefix = LANGUAGE_URL_PREFIX[p.language] ?? 'en';
      const loc = `${baseUrl}/${prefix}/${p.slug}`;
      const lastmod = p.updatedAt.toISOString();
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function generateRobotsTxt(baseUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');
}

/** FR-092: manage redirects (301 support). */
export async function resolveRedirect(fromPath: string): Promise<{ toPath: string; statusCode: number } | null> {
  const redirect = await findRedirect(fromPath);
  if (!redirect) return null;
  return { toPath: redirect.toPath, statusCode: redirect.statusCode };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
