import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

// --- Pages ------------------------------------------------------------

export function findPublishedPageBySlug(slug: string, language: string, tx?: TransactionClient) {
  return db(tx).page.findUnique({
    where: { slug_language: { slug, language: language as never } },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
}

export function findPageById(id: string, tx?: TransactionClient) {
  return db(tx).page.findUnique({ where: { id }, include: { blocks: { orderBy: { order: 'asc' } } } });
}

export function findPageByPreviewToken(token: string, tx?: TransactionClient) {
  return db(tx).page.findUnique({ where: { previewToken: token }, include: { blocks: { orderBy: { order: 'asc' } } } });
}

/** `tag` filters to pages whose `tags` array contains the given value (002 FR-049 category/tag filter). */
export function findPagesByTemplate(
  template: string,
  language: string,
  pagination: { skip: number; take: number },
  tag?: string,
  tx?: TransactionClient,
) {
  const where: Prisma.PageWhereInput = {
    template: template as never,
    language: language as never,
    status: 'PUBLISHED',
    ...(tag ? { tags: { has: tag } } : {}),
  };
  return Promise.all([
    db(tx).page.findMany({ where, orderBy: { publishAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    db(tx).page.count({ where }),
  ]);
}

export function findAllPublishedSlugs(tx?: TransactionClient) {
  return db(tx).page.findMany({
    where: { status: 'PUBLISHED', noIndex: false },
    select: { slug: true, language: true, updatedAt: true },
  });
}

export function createPage(data: Prisma.PageCreateInput, tx?: TransactionClient) {
  return db(tx).page.create({ data });
}

export function updatePage(id: string, data: Prisma.PageUpdateInput, tx?: TransactionClient) {
  return db(tx).page.update({ where: { id }, data });
}

/**
 * Replaces all of a page's blocks. Always called from within an
 * existing `withTransaction()` call site (see `page.service.ts`), so
 * this deliberately runs its writes sequentially against the SAME `tx`
 * client rather than opening a nested `$transaction()` — Prisma does
 * not support nested transactions, and the outer transaction already
 * provides the atomicity guarantee.
 */
export async function replacePageBlocks(
  pageId: string,
  blocks: Array<{ type: string; order: number; visible: boolean; data: unknown }>,
  tx?: TransactionClient,
): Promise<void> {
  const client = db(tx);
  await client.pageBlock.deleteMany({ where: { pageId } });
  for (const b of blocks) {
    await client.pageBlock.create({
      data: { pageId, type: b.type as never, order: b.order, visible: b.visible, data: b.data as Prisma.InputJsonValue },
    });
  }
}

export function countPageVersions(pageId: string, tx?: TransactionClient) {
  return db(tx).pageVersion.count({ where: { pageId } });
}

export function createPageVersion(
  pageId: string,
  versionNumber: number,
  snapshot: unknown,
  editedBy: string | null,
  tx?: TransactionClient,
) {
  return db(tx).pageVersion.create({
    data: { pageId, versionNumber, snapshot: snapshot as Prisma.InputJsonValue, editedBy },
  });
}

export function findPageVersions(pageId: string, tx?: TransactionClient) {
  return db(tx).pageVersion.findMany({ where: { pageId }, orderBy: { versionNumber: 'desc' } });
}

// --- Navigation ---------------------------------------------------------

export function findNavigationTree(location: string, tx?: TransactionClient) {
  return db(tx).navigationItem.findMany({
    where: { location: location as never, visible: true },
    orderBy: { order: 'asc' },
  });
}

// --- Announcements --------------------------------------------------------

export function findActiveAnnouncements(now: Date, tx?: TransactionClient) {
  return db(tx).announcement.findMany({
    where: { startDate: { lte: now }, endDate: { gt: now } },
    orderBy: { priority: 'desc' },
  });
}

// --- FAQ ------------------------------------------------------------------

export function findVisibleFaqs(tx?: TransactionClient) {
  return db(tx).faqEntry.findMany({ where: { visible: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] });
}

// --- Redirects --------------------------------------------------------

export function findRedirect(fromPath: string, tx?: TransactionClient) {
  return db(tx).redirect.findUnique({ where: { fromPath } });
}

// --- Contact / Newsletter / Consent -----------------------------------

export function createContactSubmission(
  data: { name: string; email: string; phone: string | null; department: string; message: string; ipAddress: string | null },
  tx?: TransactionClient,
) {
  return db(tx).contactSubmission.create({ data: data as never });
}

/**
 * Upsert-by-email (duplicate-safe: re-subscribing an existing email
 * never creates a second row). A re-subscribe rotates the unsubscribe
 * token (defense in depth — an old, possibly-leaked unsubscribe link
 * for a since-unsubscribed-then-resubscribed address stops working).
 */
export function upsertNewsletterSubscriber(email: string, unsubscribeTokenHash: string, tx?: TransactionClient) {
  return db(tx).newsletterSubscriber.upsert({
    where: { email },
    create: { email, unsubscribeTokenHash },
    update: { unsubscribedAt: null, unsubscribeTokenHash },
  });
}

export function findSubscriberByUnsubscribeTokenHash(tokenHash: string, tx?: TransactionClient) {
  return db(tx).newsletterSubscriber.findUnique({ where: { unsubscribeTokenHash: tokenHash } });
}

export function markSubscriberUnsubscribed(id: string, tx?: TransactionClient) {
  return db(tx).newsletterSubscriber.update({ where: { id }, data: { unsubscribedAt: new Date() } });
}

export function recordConsent(
  data: { userId?: string | null; email?: string | null; channel: string; policyVersion: string; source: string; ipAddress: string | null },
  tx?: TransactionClient,
) {
  return db(tx).consentRecord.create({ data: data as never });
}
