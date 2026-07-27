import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { parsePaginationParams, buildPaginationMeta, type RawPaginationQuery } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';

export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

export interface SearchResult {
  type: 'page' | 'faq';
  id: string;
  title: string;
  url: string;
  excerpt: HighlightSegment[];
  score: number;
}

/**
 * 002 FR-009: global search (Phase 5 Part 2 completion). Part 1 scope
 * boundary unchanged: Pages + FAQs only — Courses/Mentors/Events/
 * Programs are not built yet (see docs/public-site/TRACEABILITY.md).
 *
 * Searches slug, title, AND summary (seoDescription) — Part 1 only
 * searched title. **No draft leakage**: every query filters
 * `status: 'PUBLISHED'` (pages) / `visible: true` (FAQs) — verified
 * directly by an integration test asserting a DRAFT page never appears
 * in results even when its title matches the query exactly.
 *
 * Safe ranking: a simple, fully-deterministic relevance score (no
 * external ranking service) — exact title match scores highest, then
 * title-starts-with, then any-field-contains. Ties break by most
 * recently updated. Combined page+FAQ result set is ranked and paginated
 * together in application code (two different Prisma models can't be
 * ranked in one SQL query without raw SQL, which this module avoids).
 */
export async function searchSite(
  query: string,
  pagination: RawPaginationQuery,
): Promise<{ data: SearchResult[]; meta: PaginationMeta }> {
  const db = getPrismaClient();
  if (!db) throw AppError.internal('Database is not connected');

  const normalizedQuery = query.trim();
  const { page, pageSize } = parsePaginationParams(pagination);

  // Fetch a bounded candidate pool per source (not the full table) —
  // ranking/pagination happens over this pool, which is generous enough
  // for a marketing site's realistic content volume without risking an
  // unbounded query.
  const CANDIDATE_POOL_SIZE = 100;

  const [pages, faqs] = await Promise.all([
    db.page.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { slug: { contains: normalizedQuery, mode: 'insensitive' } },
          { title: { contains: normalizedQuery, mode: 'insensitive' } },
          { seoDescription: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: CANDIDATE_POOL_SIZE,
    }),
    db.faqEntry.findMany({
      where: {
        visible: true,
        OR: [
          { question: { contains: normalizedQuery, mode: 'insensitive' } },
          { answer: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: CANDIDATE_POOL_SIZE,
    }),
  ]);

  const pageResults: SearchResult[] = pages.map((p) => ({
    type: 'page' as const,
    id: p.id,
    title: p.title,
    url: `/${p.slug}`,
    excerpt: highlight(p.seoDescription ?? '', normalizedQuery),
    score: scoreMatch(normalizedQuery, [p.title, p.slug, p.seoDescription ?? '']),
  }));

  const faqResults: SearchResult[] = faqs.map((f) => ({
    type: 'faq' as const,
    id: f.id,
    title: f.question,
    url: `/faq#${f.id}`,
    excerpt: highlight(f.answer.slice(0, 200), normalizedQuery),
    score: scoreMatch(normalizedQuery, [f.question, f.answer]),
  }));

  const ranked = [...pageResults, ...faqResults].sort((a, b) => b.score - a.score);

  const totalItems = ranked.length;
  const start = (page - 1) * pageSize;
  const data = ranked.slice(start, start + pageSize);

  return { data, meta: buildPaginationMeta(page, pageSize, totalItems) };
}

/** Exact match = 3, starts-with = 2, contains = 1, no match = 0 (best across all fields). */
export function scoreMatch(query: string, fields: string[]): number {
  const lowerQuery = query.toLowerCase();
  let best = 0;

  for (const field of fields) {
    const lowerField = field.toLowerCase();
    if (lowerField === lowerQuery) best = Math.max(best, 3);
    else if (lowerField.startsWith(lowerQuery)) best = Math.max(best, 2);
    else if (lowerField.includes(lowerQuery)) best = Math.max(best, 1);
  }

  return best;
}

/**
 * Splits `text` into highlight/non-highlight segments around the query
 * match — returned as structured data (never raw HTML) so the frontend
 * renders it as plain React elements, with zero injection risk (Phase
 * 5 Part 2 security review: no new `dangerouslySetInnerHTML` surface
 * introduced for search results).
 */
export function highlight(text: string, query: string): HighlightSegment[] {
  if (!query || !text) return [{ text, highlight: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return [{ text, highlight: false }];

  const segments: HighlightSegment[] = [];
  if (index > 0) segments.push({ text: text.slice(0, index), highlight: false });
  segments.push({ text: text.slice(index, index + query.length), highlight: true });
  if (index + query.length < text.length) segments.push({ text: text.slice(index + query.length), highlight: false });

  return segments;
}
