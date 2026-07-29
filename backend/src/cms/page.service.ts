import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { generateSecureToken, hashToken } from '../auth/secure-token.util';
import { parsePaginationParams, buildPaginationMeta, type RawPaginationQuery } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';
import { validateBlockData } from './block-schemas';
import {
  findPublishedPageBySlug,
  findPageByPreviewTokenHash,
  findPageById,
  findPagesByTemplate,
  createPage,
  updatePage,
  replacePageBlocks,
  countPageVersions,
  createPageVersion,
  findPageVersions,
} from './cms.repository';
import type { RenderedPage } from './cms.types';

const PREVIEW_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (FR-105: preview links expire)

function toRenderedPage(page: {
  id: string; slug: string; language: string; template: string; status: string; title: string;
  seoTitle: string | null; seoDescription: string | null; canonicalUrl: string | null; ogImageUrl: string | null;
  noIndex: boolean; tags: string[]; headerVisible: boolean; footerVisible: boolean; publishAt: Date | null; updatedAt: Date;
  blocks: Array<{ id: string; type: string; order: number; visible: boolean; data: unknown }>;
}): RenderedPage {
  return {
    id: page.id,
    slug: page.slug,
    language: page.language,
    template: page.template,
    status: page.status,
    title: page.title,
    seo: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription,
      canonicalUrl: page.canonicalUrl,
      ogImageUrl: page.ogImageUrl,
      noIndex: page.noIndex,
    },
    tags: page.tags,
    headerVisible: page.headerVisible,
    footerVisible: page.footerVisible,
    blocks: page.blocks.filter((b) => b.visible).map((b) => ({ id: b.id, type: b.type, order: b.order, data: b.data })),
    publishAt: page.publishAt,
    updatedAt: page.updatedAt,
  };
}

/**
 * Public page read (002 FR-086, FR-087, FR-105). A page is publicly
 * visible only when PUBLISHED and within its publish/expire window —
 * UNLESS a valid, unexpired preview token is presented (admin preview,
 * FR-089/FR-105), in which case any status renders.
 */
export async function getPublicPage(
  slug: string,
  language: string,
  previewToken?: string,
): Promise<RenderedPage> {
  if (previewToken) {
    const page = await findPageByPreviewTokenHash(hashToken(previewToken));
    if (!page || page.slug !== slug || !page.previewExpiresAt || page.previewExpiresAt < new Date()) {
      throw AppError.notFound('Page not found');
    }
    return toRenderedPage(page);
  }

  const page = await findPublishedPageBySlug(slug, language);
  if (!page || page.status !== 'PUBLISHED') throw AppError.notFound('Page not found');

  const now = new Date();
  if (page.publishAt && page.publishAt > now) throw AppError.notFound('Page not found');
  if (page.expireAt && page.expireAt <= now) throw AppError.notFound('Page not found');

  return toRenderedPage(page);
}

/** 002 FR-049: category/tag filter + pagination for the Blog listing. */
export async function listPagesByTemplate(
  template: string,
  language: string,
  pagination: RawPaginationQuery,
  tag?: string,
): Promise<{ data: RenderedPage[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findPagesByTemplate(template, language, { skip, take }, tag);
  return { data: rows.map((r) => toRenderedPage({ ...r, blocks: [] })), meta: buildPaginationMeta(page, pageSize, total) };
}

// --- Admin write path (002 FR-084; backend foundation only, no editor UI) ---

export interface CreatePageInput {
  slug: string;
  language: string;
  template: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noIndex: boolean;
  tags: string[];
  audienceRoles: string[];
  headerVisible: boolean;
  footerVisible: boolean;
  publishAt?: string;
  expireAt?: string;
  blocks: Array<{ type: string; order: number; visible: boolean; data: unknown }>;
  actorId: string;
}

function validateBlocks(blocks: CreatePageInput['blocks']): void {
  const errors: string[] = [];
  for (const block of blocks) {
    const result = validateBlockData(block.type, block.data);
    if (!result.valid) errors.push(`Block ${block.type} (order ${block.order}): ${result.errors?.join('; ')}`);
  }
  if (errors.length > 0) throw AppError.badRequest('Invalid block data', { errors });
}

export async function createCmsPage(input: CreatePageInput) {
  validateBlocks(input.blocks);

  return withTransaction(async (tx) => {
    const page = await createPage(
      {
        slug: input.slug,
        language: input.language as never,
        template: input.template as never,
        title: input.title,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        canonicalUrl: input.canonicalUrl,
        ogImageUrl: input.ogImageUrl,
        noIndex: input.noIndex,
        tags: input.tags,
        audienceRoles: input.audienceRoles,
        headerVisible: input.headerVisible,
        footerVisible: input.footerVisible,
        publishAt: input.publishAt ? new Date(input.publishAt) : undefined,
        expireAt: input.expireAt ? new Date(input.expireAt) : undefined,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await replacePageBlocks(page.id, input.blocks, tx);
    await createPageVersion(page.id, 1, { page: input, blocks: input.blocks }, input.actorId, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId: input.actorId, action: 'cms.page.created', resourceType: 'page', resourceId: page.id },
      tx,
    );

    return page;
  });
}

export async function updateCmsPage(
  pageId: string,
  input: Partial<CreatePageInput> & { actorId: string },
) {
  if (input.blocks) validateBlocks(input.blocks);

  return withTransaction(async (tx) => {
    const existing = await findPageById(pageId, tx);
    if (!existing) throw AppError.notFound('Page not found');

    const updated = await updatePage(
      pageId,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.canonicalUrl !== undefined ? { canonicalUrl: input.canonicalUrl } : {}),
        ...(input.ogImageUrl !== undefined ? { ogImageUrl: input.ogImageUrl } : {}),
        ...(input.noIndex !== undefined ? { noIndex: input.noIndex } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.audienceRoles !== undefined ? { audienceRoles: input.audienceRoles } : {}),
        ...(input.headerVisible !== undefined ? { headerVisible: input.headerVisible } : {}),
        ...(input.footerVisible !== undefined ? { footerVisible: input.footerVisible } : {}),
        ...(input.publishAt !== undefined ? { publishAt: new Date(input.publishAt) } : {}),
        ...(input.expireAt !== undefined ? { expireAt: new Date(input.expireAt) } : {}),
        updatedBy: input.actorId,
      },
      tx,
    );

    if (input.blocks) await replacePageBlocks(pageId, input.blocks, tx);

    // FR-088: every update snapshots a new, non-destructive version.
    const versionCount = await countPageVersions(pageId, tx);
    await createPageVersion(pageId, versionCount + 1, { page: input, blocks: input.blocks ?? [] }, input.actorId, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId: input.actorId, action: 'cms.page.updated', resourceType: 'page', resourceId: pageId },
      tx,
    );

    return updated;
  });
}

/** FR-087/001 FR-097: Draft → Review → Approved → Scheduled → Published → Unpublished → Archived. */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'APPROVED', 'ARCHIVED'],
  APPROVED: ['SCHEDULED', 'PUBLISHED', 'DRAFT', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED', 'ARCHIVED'],
  // 001 FR-097: taking a live page down is UNPUBLISHED, not ARCHIVED —
  // ARCHIVED is a separate, more final retirement a moderator chooses
  // explicitly, never an automatic synonym for "no longer published."
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED', 'DRAFT'],
  UNPUBLISHED: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

export async function updatePageStatus(pageId: string, newStatus: string, actorId: string) {
  const page = await findPageById(pageId);
  if (!page) throw AppError.notFound('Page not found');

  const allowed = VALID_TRANSITIONS[page.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw AppError.badRequest(`Cannot transition page from ${page.status} to ${newStatus}`);
  }

  const updated = await updatePage(pageId, { status: newStatus as never, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'cms.page.status_changed',
    resourceType: 'page',
    resourceId: pageId,
    beforeState: { status: page.status },
    afterState: { status: newStatus },
  });

  return updated;
}

/** FR-105: admin preview links expire. */
export async function generatePreviewLink(pageId: string, actorId: string): Promise<{ token: string; expiresAt: Date }> {
  const page = await findPageById(pageId);
  if (!page) throw AppError.notFound('Page not found');

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS);

  await updatePage(pageId, { previewTokenHash: hashToken(token), previewExpiresAt: expiresAt, updatedBy: actorId });

  return { token, expiresAt };
}

export async function listVersionHistory(pageId: string) {
  return findPageVersions(pageId);
}
