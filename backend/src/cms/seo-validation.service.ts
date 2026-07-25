import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';

export interface SeoValidationIssue {
  type: 'duplicate_title' | 'duplicate_canonical' | 'invalid_slug';
  value: string;
  pageIds: string[];
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * SEO validation across all published pages (Phase 5 Part 2
 * §"SEO": "Validate: duplicate titles, duplicate canonicals, invalid
 * slugs"). Not wired to a public route — this is an operational check
 * (run via a script/test, or a future admin diagnostics surface), not
 * a per-request concern; duplicate-title/canonical detection requires
 * scanning the whole published-page set, which is the wrong cost to
 * pay on every page render.
 */
export async function validateSeoAcrossPublishedPages(): Promise<SeoValidationIssue[]> {
  const db = getPrismaClient();
  if (!db) throw AppError.internal('Database is not connected');

  const pages = await db.page.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true, seoTitle: true, title: true, canonicalUrl: true },
  });

  const issues: SeoValidationIssue[] = [];

  // Duplicate titles (FR-090: "unique title" per indexable page).
  const byTitle = new Map<string, string[]>();
  for (const page of pages) {
    const effectiveTitle = (page.seoTitle ?? page.title).trim().toLowerCase();
    if (!byTitle.has(effectiveTitle)) byTitle.set(effectiveTitle, []);
    byTitle.get(effectiveTitle)!.push(page.id);
  }
  for (const [title, ids] of byTitle) {
    if (ids.length > 1) issues.push({ type: 'duplicate_title', value: title, pageIds: ids });
  }

  // Duplicate canonical URLs (FR-090/FR-092: "no duplicate canonical URLs").
  const byCanonical = new Map<string, string[]>();
  for (const page of pages) {
    if (!page.canonicalUrl) continue;
    const normalized = page.canonicalUrl.trim().toLowerCase();
    if (!byCanonical.has(normalized)) byCanonical.set(normalized, []);
    byCanonical.get(normalized)!.push(page.id);
  }
  for (const [canonicalUrl, ids] of byCanonical) {
    if (ids.length > 1) issues.push({ type: 'duplicate_canonical', value: canonicalUrl, pageIds: ids });
  }

  // Invalid slugs — defense in depth: the create/update API already
  // rejects a malformed slug via Zod (cms.validation.ts), so this
  // should never find anything in practice; it exists to catch drift
  // from any future write path that bypasses that validation (e.g. a
  // direct database migration/import).
  for (const page of pages) {
    if (!SLUG_PATTERN.test(page.slug)) {
      issues.push({ type: 'invalid_slug', value: page.slug, pageIds: [page.id] });
    }
  }

  return issues;
}
