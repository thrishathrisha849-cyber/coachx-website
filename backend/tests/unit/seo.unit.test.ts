import { generateRobotsTxt } from '../../src/cms/seo.service';

describe('seo.service — generateRobotsTxt()', () => {
  it('allows crawling by default and points at the sitemap', () => {
    const robots = generateRobotsTxt('https://example.com');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('disallows /admin/ and /api/ paths', () => {
    const robots = generateRobotsTxt('https://example.com');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /api/');
  });
});
