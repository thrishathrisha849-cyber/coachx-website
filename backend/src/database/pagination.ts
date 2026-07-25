import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type PaginationMeta,
} from '@coachx/shared';

/**
 * Offset/page-based pagination helpers, built around the SAME
 * `PaginationMeta` shape already defined in `@coachx/shared`
 * (`{ page, pageSize, totalItems, totalPages }`) — deliberately not a
 * second, competing pagination shape (e.g. cursor-based), to avoid
 * exactly the kind of duplicate-canonical-shape problem this phase's
 * ownership review is about, just applied to a shared type instead of
 * an entity.
 *
 * A future feature that genuinely needs cursor-based pagination (e.g.
 * for a very large, frequently-changing feed) should add a distinct,
 * clearly-named type for that — not overload this one.
 */

export interface RawPaginationQuery {
  page?: string | number | undefined;
  pageSize?: string | number | undefined;
}

export interface ParsedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/**
 * Parses and clamps raw (e.g. Express `req.query`) pagination params
 * into safe, bounded values — never trusts the caller's `pageSize`
 * beyond `MAX_PAGE_SIZE`, and never produces a negative `skip`.
 */
export function parsePaginationParams(raw: RawPaginationQuery = {}): ParsedPagination {
  const page = clampInt(raw.page, DEFAULT_PAGE, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = clampInt(raw.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Generic pagination runner: given a `findMany`-shaped function and a
 * `count`-shaped function (both caller-supplied — this module owns no
 * Prisma model), runs both concurrently and returns the standard
 * `{ data, meta }` shape. Intentionally has no knowledge of any
 * specific business model — a future feature's own repository passes
 * in its own `(skip, take) => prisma.course.findMany(...)`-style
 * functions.
 */
export async function paginate<T>(
  raw: RawPaginationQuery,
  findMany: (args: { skip: number; take: number }) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<PaginatedResult<T>> {
  const { page, pageSize, skip, take } = parsePaginationParams(raw);

  const [data, totalItems] = await Promise.all([findMany({ skip, take }), count()]);

  return { data, meta: buildPaginationMeta(page, pageSize, totalItems) };
}

function clampInt(value: string | number | undefined, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}
