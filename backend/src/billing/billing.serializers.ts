import type {
  PublicProduct,
  AdminProduct,
  PublicProductPrice,
  AdminProductPrice,
  PublicPlanEntitlement,
  AdminPlanEntitlement,
  PublicPlanVersion,
  AdminPlanVersion,
  PublicMembershipPlan,
  AdminMembershipPlan,
} from './billing.types';

/**
 * Explicit serializers — same discipline as `lms.serializers.ts` /
 * `page.service.ts`'s `toRenderedPage()`: every public/admin-facing API
 * response is built by one of these, never a raw Prisma row returned
 * directly.
 */

type ProductRow = {
  id: string;
  code: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  shortDescription: string | null;
  mediaUrls: string[];
  category: string | null;
  pricingModel: string;
  currency: string;
  fulfilmentMethod: string;
  taxCategory: string | null;
  sellerId: string | null;
  availabilityStartAt: Date | null;
  availabilityEndAt: Date | null;
  maxQuantity: number | null;
  refundPolicy: string | null;
  termsVersion: string | null;
  status: string;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    slug: row.slug,
    type: row.type,
    description: row.description,
    shortDescription: row.shortDescription,
    mediaUrls: row.mediaUrls,
    category: row.category,
    pricingModel: row.pricingModel,
    currency: row.currency,
    fulfilmentMethod: row.fulfilmentMethod,
  };
}

export function toAdminProduct(row: ProductRow): AdminProduct {
  return {
    ...toPublicProduct(row),
    taxCategory: row.taxCategory,
    sellerId: row.sellerId,
    availabilityStartAt: row.availabilityStartAt,
    availabilityEndAt: row.availabilityEndAt,
    maxQuantity: row.maxQuantity,
    refundPolicy: row.refundPolicy,
    termsVersion: row.termsVersion,
    status: row.status,
    version: row.version,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type ProductPriceRow = {
  id: string;
  productId: string;
  priceLineageId: string;
  version: number;
  currency: string;
  unitAmountMinor: number;
  taxInclusion: string;
  billingInterval: string;
  intervalCount: number;
  trialPeriodDays: number | null;
  setupFeeMinor: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  effectiveStartAt: Date | null;
  effectiveEndAt: Date | null;
  region: string | null;
  userSegment: string | null;
  providerPriceReference: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicProductPrice(row: ProductPriceRow): PublicProductPrice {
  return {
    id: row.id,
    currency: row.currency,
    unitAmountMinor: row.unitAmountMinor,
    taxInclusion: row.taxInclusion,
    billingInterval: row.billingInterval,
    intervalCount: row.intervalCount,
    trialPeriodDays: row.trialPeriodDays,
    setupFeeMinor: row.setupFeeMinor,
    region: row.region,
    userSegment: row.userSegment,
  };
}

export function toAdminProductPrice(row: ProductPriceRow): AdminProductPrice {
  return {
    ...toPublicProductPrice(row),
    productId: row.productId,
    priceLineageId: row.priceLineageId,
    version: row.version,
    minQuantity: row.minQuantity,
    maxQuantity: row.maxQuantity,
    effectiveStartAt: row.effectiveStartAt,
    effectiveEndAt: row.effectiveEndAt,
    providerPriceReference: row.providerPriceReference,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type PlanEntitlementRow = {
  id: string;
  planVersionId: string;
  key: string;
  type: string;
  value: unknown;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicPlanEntitlement(row: PlanEntitlementRow): PublicPlanEntitlement {
  return {
    key: row.key,
    type: row.type,
    value: row.value,
    description: row.description,
    displayOrder: row.displayOrder,
  };
}

export function toAdminPlanEntitlement(row: PlanEntitlementRow): AdminPlanEntitlement {
  return {
    ...toPublicPlanEntitlement(row),
    id: row.id,
    planVersionId: row.planVersionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type PlanVersionRow = {
  id: string;
  planId: string;
  versionNumber: number;
  name: string;
  publicDescription: string | null;
  internalDescription: string | null;
  targetCustomer: string | null;
  features: string[];
  limits: unknown;
  supportedBillingIntervals: string[];
  trialEligible: boolean;
  trialDays: number | null;
  upgradePaths: unknown;
  downgradePaths: unknown;
  cancellationPolicy: string | null;
  gracePeriodPolicy: string | null;
  refundPolicy: string | null;
  badgeText: string | null;
  recommendedReason: string | null;
  status: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  entitlements: PlanEntitlementRow[];
};

export function toPublicPlanVersion(row: PlanVersionRow): PublicPlanVersion {
  return {
    versionNumber: row.versionNumber,
    name: row.name,
    publicDescription: row.publicDescription,
    targetCustomer: row.targetCustomer,
    features: row.features,
    limits: row.limits,
    supportedBillingIntervals: row.supportedBillingIntervals,
    trialEligible: row.trialEligible,
    trialDays: row.trialDays,
    cancellationPolicy: row.cancellationPolicy,
    gracePeriodPolicy: row.gracePeriodPolicy,
    refundPolicy: row.refundPolicy,
    badgeText: row.badgeText,
    recommendedReason: row.recommendedReason,
    entitlements: row.entitlements.map(toPublicPlanEntitlement),
  };
}

export function toAdminPlanVersion(row: PlanVersionRow): AdminPlanVersion {
  return {
    ...toPublicPlanVersion(row),
    id: row.id,
    planId: row.planId,
    internalDescription: row.internalDescription,
    upgradePaths: row.upgradePaths,
    downgradePaths: row.downgradePaths,
    status: row.status,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    entitlements: row.entitlements.map(toAdminPlanEntitlement),
  };
}

type MembershipPlanRow = {
  id: string;
  code: string;
  productId: string;
  status: string;
  displayOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: PlanVersionRow[];
};

export function toAdminMembershipPlan(row: MembershipPlanRow): AdminMembershipPlan {
  return {
    id: row.id,
    code: row.code,
    productId: row.productId,
    status: row.status,
    displayOrder: row.displayOrder,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    versions: row.versions.map(toAdminPlanVersion),
  };
}

/**
 * Public plan-comparison shape — combines the plan's PUBLISHED version
 * with its product's currently ACTIVE prices. Throws if no published
 * version exists — callers (the public repository query) must never pass
 * a plan without one; a plan lacking a published version is not public
 * data by definition (FR-013).
 */
export function toPublicMembershipPlan(
  row: MembershipPlanRow,
  prices: ProductPriceRow[],
): PublicMembershipPlan {
  const publishedVersion = row.versions.find((v) => v.status === 'PUBLISHED');
  if (!publishedVersion) {
    throw new Error('toPublicMembershipPlan called on a plan with no published version');
  }

  return {
    id: row.id,
    code: row.code,
    displayOrder: row.displayOrder,
    productId: row.productId,
    currentVersion: toPublicPlanVersion(publishedVersion),
    prices: prices.map(toPublicProductPrice),
  };
}
