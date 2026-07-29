import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { parsePaginationParams, buildPaginationMeta } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';
import {
  findProductBySlug,
  findProductByCode,
  findProductById,
  findProductsAdmin,
  createProduct,
  updateProduct,
  findPriceById,
  findPricesForProduct,
  findActivePricesForProduct,
  findLatestPriceInLineage,
  createProductPrice,
  updateProductPrice,
  type AdminProductFilter,
} from './product.repository';
import { toAdminProduct, toPublicProduct, toAdminProductPrice, toPublicProductPrice } from './billing.serializers';
import type { AdminProduct, PublicProduct, AdminProductPrice, PublicProductPrice } from './billing.types';

export interface ProductInput {
  code: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  shortDescription?: string;
  mediaUrls?: string[];
  category?: string;
  sellerId?: string;
  pricingModel: string;
  currency?: string;
  taxCategory?: string;
  fulfilmentMethod?: string;
  availabilityStartAt?: string;
  availabilityEndAt?: string;
  maxQuantity?: number;
  refundPolicy?: string;
  termsVersion?: string;
  /// 001 FR-062/FR-063 — sponsored/affiliate disclosure metadata.
  isSponsored?: boolean;
  sponsorLabel?: string;
  isAffiliate?: boolean;
  affiliateDisclosure?: string;
}

export type ProductUpdateInput = Partial<ProductInput>;

function toDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

// ----------------------------------------------------------------------------
// FR-003's product status model. A deliberately simple, forward-leaning
// transition map (not a full review-gate workflow like Course's — this
// phase's product catalog has no reviewer-role distinction yet); every
// transition still goes through this single choke point so a future
// reviewer-gate requirement has exactly one place to add itself.
// ----------------------------------------------------------------------------
const PRODUCT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW_PENDING', 'ARCHIVED'],
  REVIEW_PENDING: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['SCHEDULED', 'ACTIVE', 'ARCHIVED'],
  SCHEDULED: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'SOLD_OUT', 'EXPIRED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ARCHIVED'],
  SOLD_OUT: ['ACTIVE', 'ARCHIVED'],
  EXPIRED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
  REJECTED: ['DRAFT'],
};

function assertValidProductTransition(current: string, next: string): void {
  if (current === next) return;
  const allowed = PRODUCT_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw AppError.badRequest(`Cannot transition a product from ${current} to ${next}`);
  }
}

export async function createProductCatalogItem(input: ProductInput, actorId: string): Promise<AdminProduct> {
  const [existingSlug, existingCode] = await Promise.all([
    findProductBySlug(input.slug),
    findProductByCode(input.code),
  ]);
  if (existingSlug) throw AppError.conflict('A product with this slug already exists');
  if (existingCode) throw AppError.conflict('A product with this code already exists');

  return withTransaction(async (tx) => {
    const product = await createProduct(
      {
        code: input.code,
        name: input.name,
        slug: input.slug,
        type: input.type as never,
        description: input.description,
        shortDescription: input.shortDescription,
        mediaUrls: input.mediaUrls ?? [],
        category: input.category,
        sellerId: input.sellerId,
        pricingModel: input.pricingModel as never,
        currency: input.currency ?? 'INR',
        taxCategory: input.taxCategory,
        fulfilmentMethod: (input.fulfilmentMethod ?? 'INSTANT') as never,
        availabilityStartAt: toDate(input.availabilityStartAt) ?? undefined,
        availabilityEndAt: toDate(input.availabilityEndAt) ?? undefined,
        maxQuantity: input.maxQuantity,
        refundPolicy: input.refundPolicy,
        termsVersion: input.termsVersion,
        isSponsored: input.isSponsored ?? false,
        sponsorLabel: input.sponsorLabel,
        isAffiliate: input.isAffiliate ?? false,
        affiliateDisclosure: input.affiliateDisclosure,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.product.created', resourceType: 'product', resourceId: product.id },
      tx,
    );

    return toAdminProduct(product);
  });
}

export async function updateExistingProduct(
  id: string,
  input: ProductUpdateInput,
  actorId: string,
): Promise<AdminProduct> {
  return withTransaction(async (tx) => {
    const existing = await findProductById(id, tx);
    if (!existing) throw AppError.notFound('Product not found');
    if (existing.status === 'ARCHIVED') {
      throw AppError.badRequest('Cannot modify an archived product — restore it first');
    }

    const updated = await updateProduct(
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
        ...(input.mediaUrls !== undefined ? { mediaUrls: input.mediaUrls } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.sellerId !== undefined ? { sellerId: input.sellerId } : {}),
        ...(input.taxCategory !== undefined ? { taxCategory: input.taxCategory } : {}),
        ...(input.fulfilmentMethod !== undefined ? { fulfilmentMethod: input.fulfilmentMethod as never } : {}),
        ...(input.availabilityStartAt !== undefined ? { availabilityStartAt: toDate(input.availabilityStartAt) } : {}),
        ...(input.availabilityEndAt !== undefined ? { availabilityEndAt: toDate(input.availabilityEndAt) } : {}),
        ...(input.maxQuantity !== undefined ? { maxQuantity: input.maxQuantity } : {}),
        ...(input.refundPolicy !== undefined ? { refundPolicy: input.refundPolicy } : {}),
        ...(input.termsVersion !== undefined ? { termsVersion: input.termsVersion } : {}),
        ...(input.isSponsored !== undefined ? { isSponsored: input.isSponsored } : {}),
        ...(input.sponsorLabel !== undefined ? { sponsorLabel: input.sponsorLabel } : {}),
        ...(input.isAffiliate !== undefined ? { isAffiliate: input.isAffiliate } : {}),
        ...(input.affiliateDisclosure !== undefined ? { affiliateDisclosure: input.affiliateDisclosure } : {}),
        version: { increment: 1 },
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.product.updated',
        resourceType: 'product',
        resourceId: id,
        beforeState: { name: existing.name, status: existing.status },
        afterState: { name: updated.name, status: updated.status },
      },
      tx,
    );

    return toAdminProduct(updated);
  });
}

export async function changeProductStatus(id: string, newStatus: string, actorId: string): Promise<AdminProduct> {
  return withTransaction(async (tx) => {
    const existing = await findProductById(id, tx);
    if (!existing) throw AppError.notFound('Product not found');

    assertValidProductTransition(existing.status, newStatus);

    const updated = await updateProduct(id, { status: newStatus as never, updatedBy: actorId }, tx).catch(
      (error: unknown) => {
        throw normalizeDatabaseError(error);
      },
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.product.status_changed',
        resourceType: 'product',
        resourceId: id,
        beforeState: { status: existing.status },
        afterState: { status: newStatus },
      },
      tx,
    );

    return toAdminProduct(updated);
  });
}

export async function archiveProduct(id: string, actorId: string): Promise<AdminProduct> {
  return changeProductStatus(id, 'ARCHIVED', actorId);
}

export async function restoreProduct(id: string, actorId: string): Promise<AdminProduct> {
  return changeProductStatus(id, 'DRAFT', actorId);
}

export async function getProductAdmin(id: string): Promise<AdminProduct> {
  const row = await findProductById(id);
  if (!row) throw AppError.notFound('Product not found');
  return toAdminProduct(row);
}

export async function listProductsAdmin(
  filter: AdminProductFilter,
  pagination: { page?: string; pageSize?: string },
): Promise<{ data: AdminProduct[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findProductsAdmin(filter, { skip, take });
  return { data: rows.map(toAdminProduct), meta: buildPaginationMeta(page, pageSize, total) };
}

/** Public detail read — only APPROVED/ACTIVE products are ever visible (FR-003). */
export async function getPublicProductBySlug(slug: string): Promise<PublicProduct> {
  const row = await findProductBySlug(slug);
  if (!row || !['APPROVED', 'ACTIVE'].includes(row.status)) {
    throw AppError.notFound('Product not found');
  }
  return toPublicProduct(row);
}

// ============================================================================
// Product Prices
// ============================================================================

export interface ProductPriceInput {
  currency?: string;
  unitAmountMinor: number;
  taxInclusion?: string;
  billingInterval: string;
  intervalCount?: number;
  trialPeriodDays?: number;
  setupFeeMinor?: number;
  minQuantity?: number;
  maxQuantity?: number;
  effectiveStartAt?: string;
  effectiveEndAt?: string;
  region?: string;
  userSegment?: string;
}

export async function createPriceForProduct(
  productId: string,
  input: ProductPriceInput,
  actorId: string,
): Promise<AdminProductPrice> {
  return withTransaction(async (tx) => {
    const product = await findProductById(productId, tx);
    if (!product) throw AppError.notFound('Product not found');

    const price = await createProductPrice(
      {
        product: { connect: { id: productId } },
        currency: input.currency ?? product.currency,
        unitAmountMinor: input.unitAmountMinor,
        taxInclusion: (input.taxInclusion ?? 'EXCLUSIVE') as never,
        billingInterval: input.billingInterval as never,
        intervalCount: input.intervalCount ?? 1,
        trialPeriodDays: input.trialPeriodDays,
        setupFeeMinor: input.setupFeeMinor,
        minQuantity: input.minQuantity,
        maxQuantity: input.maxQuantity,
        effectiveStartAt: toDate(input.effectiveStartAt) ?? undefined,
        effectiveEndAt: toDate(input.effectiveEndAt) ?? undefined,
        region: input.region,
        userSegment: input.userSegment,
        createdBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.price.created', resourceType: 'product_price', resourceId: price.id },
      tx,
    );

    return toAdminProductPrice(price);
  });
}

/**
 * FR-006: a published (ACTIVE) price is never edited in place. If the
 * target price is still DRAFT, this updates it directly; if it is ACTIVE
 * (or any other post-draft state), this instead creates a NEW row in the
 * same `priceLineageId` with `version + 1`, leaving the original row
 * completely untouched — the only way FR-006's guarantee can be enforced
 * is by never running an UPDATE against a non-DRAFT row at all.
 */
export async function updateOrVersionPrice(
  priceId: string,
  input: Partial<ProductPriceInput>,
  actorId: string,
): Promise<AdminProductPrice> {
  return withTransaction(async (tx) => {
    const existing = await findPriceById(priceId, tx);
    if (!existing) throw AppError.notFound('Price not found');

    if (existing.status === 'DRAFT') {
      const updated = await updateProductPrice(
        priceId,
        {
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.unitAmountMinor !== undefined ? { unitAmountMinor: input.unitAmountMinor } : {}),
          ...(input.taxInclusion !== undefined ? { taxInclusion: input.taxInclusion as never } : {}),
          ...(input.billingInterval !== undefined ? { billingInterval: input.billingInterval as never } : {}),
          ...(input.intervalCount !== undefined ? { intervalCount: input.intervalCount } : {}),
          ...(input.trialPeriodDays !== undefined ? { trialPeriodDays: input.trialPeriodDays } : {}),
          ...(input.setupFeeMinor !== undefined ? { setupFeeMinor: input.setupFeeMinor } : {}),
          ...(input.minQuantity !== undefined ? { minQuantity: input.minQuantity } : {}),
          ...(input.maxQuantity !== undefined ? { maxQuantity: input.maxQuantity } : {}),
          ...(input.effectiveStartAt !== undefined ? { effectiveStartAt: toDate(input.effectiveStartAt) } : {}),
          ...(input.effectiveEndAt !== undefined ? { effectiveEndAt: toDate(input.effectiveEndAt) } : {}),
          ...(input.region !== undefined ? { region: input.region } : {}),
          ...(input.userSegment !== undefined ? { userSegment: input.userSegment } : {}),
        },
        tx,
      ).catch((error: unknown) => {
        throw normalizeDatabaseError(error);
      });

      await recordAuditEvent(
        { actorType: 'USER', actorId, action: 'billing.price.updated', resourceType: 'product_price', resourceId: priceId },
        tx,
      );

      return toAdminProductPrice(updated);
    }

    // Non-DRAFT (published/scheduled/expired/archived): version instead of editing.
    const latest = await findLatestPriceInLineage(existing.priceLineageId, tx);
    const nextVersion = (latest?.version ?? existing.version) + 1;

    const versioned = await createProductPrice(
      {
        product: { connect: { id: existing.productId } },
        priceLineageId: existing.priceLineageId,
        version: nextVersion,
        currency: input.currency ?? existing.currency,
        unitAmountMinor: input.unitAmountMinor ?? existing.unitAmountMinor,
        taxInclusion: (input.taxInclusion ?? existing.taxInclusion) as never,
        billingInterval: (input.billingInterval ?? existing.billingInterval) as never,
        intervalCount: input.intervalCount ?? existing.intervalCount,
        trialPeriodDays: input.trialPeriodDays ?? existing.trialPeriodDays,
        setupFeeMinor: input.setupFeeMinor ?? existing.setupFeeMinor,
        minQuantity: input.minQuantity ?? existing.minQuantity,
        maxQuantity: input.maxQuantity ?? existing.maxQuantity,
        effectiveStartAt: toDate(input.effectiveStartAt) ?? existing.effectiveStartAt,
        effectiveEndAt: toDate(input.effectiveEndAt) ?? existing.effectiveEndAt,
        region: input.region ?? existing.region,
        userSegment: input.userSegment ?? existing.userSegment,
        createdBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'billing.price.versioned',
        resourceType: 'product_price',
        resourceId: versioned.id,
        beforeState: { previousPriceId: existing.id, previousVersion: existing.version },
        afterState: { newPriceId: versioned.id, newVersion: nextVersion },
      },
      tx,
    );

    return toAdminProductPrice(versioned);
  });
}

export async function publishPrice(priceId: string, actorId: string): Promise<AdminProductPrice> {
  return withTransaction(async (tx) => {
    const existing = await findPriceById(priceId, tx);
    if (!existing) throw AppError.notFound('Price not found');
    if (existing.status !== 'DRAFT') {
      throw AppError.badRequest(`Cannot publish a price with status ${existing.status}`);
    }

    const updated = await updateProductPrice(priceId, { status: 'ACTIVE' }, tx).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.price.published', resourceType: 'product_price', resourceId: priceId },
      tx,
    );

    return toAdminProductPrice(updated);
  });
}

export async function archivePrice(priceId: string, actorId: string): Promise<AdminProductPrice> {
  return withTransaction(async (tx) => {
    const existing = await findPriceById(priceId, tx);
    if (!existing) throw AppError.notFound('Price not found');

    const updated = await updateProductPrice(priceId, { status: 'ARCHIVED' }, tx).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'billing.price.archived', resourceType: 'product_price', resourceId: priceId },
      tx,
    );

    return toAdminProductPrice(updated);
  });
}

export async function listPricesForProductAdmin(productId: string): Promise<AdminProductPrice[]> {
  const product = await findProductById(productId);
  if (!product) throw AppError.notFound('Product not found');
  const rows = await findPricesForProduct(productId);
  return rows.map(toAdminProductPrice);
}

export async function listActivePricesForProductPublic(productId: string): Promise<PublicProductPrice[]> {
  const rows = await findActivePricesForProduct(productId);
  return rows.map(toPublicProductPrice);
}
