/**
 * Phase 7 Part 1 — Billing Foundation shared types. Mirrors the LMS
 * module's own `lms.types.ts` split: DTOs/serializer-output shapes live
 * here, request-body shapes live in `billing.validation.ts` (inferred
 * from the Zod schemas so the two can never drift).
 */

// ============================================================================
// Products
// ============================================================================

/** Public/discovery-safe product shape — no internal audit fields. */
export interface PublicProduct {
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
  /// 001 FR-062/FR-063, Constitution Article III — always present in the
  /// PUBLIC shape (not admin-only) so the frontend can render the
  /// disclosure label before any price/CTA, never after.
  isSponsored: boolean;
  sponsorLabel: string | null;
  isAffiliate: boolean;
  affiliateDisclosure: string | null;
}

/** Admin-facing product shape — includes lifecycle/audit fields. */
export interface AdminProduct extends PublicProduct {
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
}

// ============================================================================
// Product Prices
// ============================================================================

export interface PublicProductPrice {
  id: string;
  currency: string;
  unitAmountMinor: number;
  taxInclusion: string;
  billingInterval: string;
  intervalCount: number;
  trialPeriodDays: number | null;
  setupFeeMinor: number | null;
  region: string | null;
  userSegment: string | null;
}

export interface AdminProductPrice extends PublicProductPrice {
  productId: string;
  priceLineageId: string;
  version: number;
  minQuantity: number | null;
  maxQuantity: number | null;
  effectiveStartAt: Date | null;
  effectiveEndAt: Date | null;
  providerPriceReference: string | null;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Plan Entitlements
// ============================================================================

export interface PublicPlanEntitlement {
  key: string;
  type: string;
  value: unknown;
  description: string | null;
  displayOrder: number;
}

export interface AdminPlanEntitlement extends PublicPlanEntitlement {
  id: string;
  planVersionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Plan Versions
// ============================================================================

export interface PublicPlanVersion {
  versionNumber: number;
  name: string;
  publicDescription: string | null;
  targetCustomer: string | null;
  features: string[];
  limits: unknown;
  supportedBillingIntervals: string[];
  trialEligible: boolean;
  trialDays: number | null;
  cancellationPolicy: string | null;
  gracePeriodPolicy: string | null;
  refundPolicy: string | null;
  badgeText: string | null;
  recommendedReason: string | null;
  entitlements: PublicPlanEntitlement[];
}

export interface AdminPlanVersion extends PublicPlanVersion {
  id: string;
  planId: string;
  internalDescription: string | null;
  upgradePaths: unknown;
  downgradePaths: unknown;
  status: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  entitlements: AdminPlanEntitlement[];
}

// ============================================================================
// Membership Plans
// ============================================================================

/**
 * Public plan-comparison shape (FR-013) — the plan's current PUBLISHED
 * version's content flattened together with its product's live prices.
 * A plan with no published version is never exposed publicly (never
 * returned by the public repository query in the first place).
 */
export interface PublicMembershipPlan {
  id: string;
  code: string;
  displayOrder: number;
  productId: string;
  currentVersion: PublicPlanVersion;
  prices: PublicProductPrice[];
}

export interface AdminMembershipPlan {
  id: string;
  code: string;
  productId: string;
  status: string;
  displayOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: AdminPlanVersion[];
}
