import { z } from 'zod';

/**
 * Phase 7 Part 1 — Billing Foundation request validation. Same Zod +
 * `validate()` middleware standard as every prior phase — see
 * `backend/src/lms/lms.validation.ts` for the template this follows
 * structurally.
 */

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const codePattern = /^[a-z0-9_-]+$/;
const uuid = () => z.string().uuid();

const METADATA_MAX_BYTES = 8 * 1024;
const jsonSchema = z
  .unknown()
  .optional()
  .refine((value) => value === undefined || JSON.stringify(value).length <= METADATA_MAX_BYTES, {
    message: `must serialize to at most ${METADATA_MAX_BYTES} bytes`,
  });

const paginationQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

// ============================================================================
// Enums — mirrors schema.prisma exactly (see PlanEntitlement/Product* enums).
// ============================================================================

export const PRODUCT_TYPE_VALUES = [
  'MEMBERSHIP_INDIVIDUAL',
  'MEMBERSHIP_TEAM',
  'MEMBERSHIP_ORGANIZATION',
  'COURSE',
  'COURSE_BUNDLE',
  'COHORT_PROGRAM',
  'WORKSHOP',
  'EVENT_TICKET',
  'MENTOR_SESSION',
  'MENTOR_PACKAGE',
  'EBOOK',
  'TEMPLATE',
  'DIGITAL_TOOLKIT',
  'PODCAST_PREMIUM',
  'AI_CREDITS',
  'AI_SUBSCRIPTION_ADDON',
  'CERTIFICATION_FEE',
  'CHALLENGE_ENTRY',
  'MERCHANDISE',
  'GIFT_MEMBERSHIP',
  'CUSTOM',
] as const;

export const PRODUCT_PRICING_MODEL_VALUES = [
  'FREE',
  'ONE_TIME_FIXED',
  'RECURRING_FIXED',
  'USAGE_BASED',
  'PER_SEAT',
  'TIERED',
  'PACKAGE',
  'PAY_WHAT_YOU_WANT',
  'CUSTOM_QUOTE',
  'INSTALLMENT',
  'DEPOSIT_PLUS_BALANCE',
  'ADD_ON',
  'CREDIT_BASED_REDEMPTION',
  'POINTS_PLUS_CASH',
  'PROMOTIONAL_TEMPORARY',
] as const;

export const PRODUCT_FULFILMENT_METHOD_VALUES = ['INSTANT', 'MANUAL', 'SCHEDULED'] as const;

export const PRODUCT_STATUS_VALUES = [
  'DRAFT',
  'REVIEW_PENDING',
  'APPROVED',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'SOLD_OUT',
  'EXPIRED',
  'ARCHIVED',
  'REJECTED',
] as const;

export const TAX_INCLUSION_VALUES = ['INCLUSIVE', 'EXCLUSIVE'] as const;

export const BILLING_INTERVAL_VALUES = [
  'ONE_TIME',
  'MONTHLY',
  'QUARTERLY',
  'HALF_YEARLY',
  'ANNUAL',
  'MULTI_YEAR',
  'CUSTOM_CONTRACT',
] as const;

export const MEMBERSHIP_PLAN_STATUS_VALUES = ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'] as const;

export const RECOMMENDED_REASON_VALUES = ['BEST_VALUE', 'MOST_POPULAR', 'EDITOR_CHOICE'] as const;

export const ENTITLEMENT_TYPE_VALUES = [
  'BOOLEAN_ACCESS',
  'NUMERIC_QUOTA',
  'CURRENCY_CREDIT',
  'PERCENTAGE_DISCOUNT',
  'CONTENT_SCOPE',
  'ROLE_GRANT',
  'TIME_LIMITED_ACCESS',
  'USAGE_RESET',
  'SEAT_BASED_ACCESS',
  'REGION_RESTRICTED_ACCESS',
] as const;

// ============================================================================
// Products
// ============================================================================

const productBodyBase = z.object({
  code: z.string().trim().toLowerCase().regex(codePattern, 'Invalid code format').max(60),
  name: z.string().trim().min(2).max(200),
  slug: z.string().regex(slugPattern, 'Invalid slug format').max(220),
  type: z.enum(PRODUCT_TYPE_VALUES),
  description: z.string().max(20000).optional(),
  shortDescription: z.string().max(300).optional(),
  mediaUrls: z.array(z.string().max(500)).max(20).default([]),
  category: z.string().max(100).optional(),
  sellerId: uuid().optional(),
  pricingModel: z.enum(PRODUCT_PRICING_MODEL_VALUES),
  currency: z.string().length(3).default('INR'),
  taxCategory: z.string().max(60).optional(),
  fulfilmentMethod: z.enum(PRODUCT_FULFILMENT_METHOD_VALUES).default('INSTANT'),
  availabilityStartAt: z.string().datetime().optional(),
  availabilityEndAt: z.string().datetime().optional(),
  maxQuantity: z.number().int().min(1).max(1_000_000).optional(),
  refundPolicy: z.string().max(5000).optional(),
  termsVersion: z.string().max(40).optional(),
  // 001 FR-062/FR-063 — sponsored/affiliate disclosure metadata.
  isSponsored: z.boolean().default(false),
  sponsorLabel: z.string().max(120).optional(),
  isAffiliate: z.boolean().default(false),
  affiliateDisclosure: z.string().max(300).optional(),
});

export const createProductSchema = z.object({ body: productBodyBase });

export const updateProductSchema = z.object({
  params: z.object({ id: uuid() }),
  body: productBodyBase
    .partial()
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const changeProductStatusSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({ status: z.enum(PRODUCT_STATUS_VALUES) }),
});

export const productIdParamSchema = z.object({ params: z.object({ id: uuid() }) });
export const productSlugParamSchema = z.object({ params: z.object({ slug: z.string().regex(slugPattern) }) });

export const adminProductQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(PRODUCT_STATUS_VALUES).optional(),
    type: z.enum(PRODUCT_TYPE_VALUES).optional(),
    q: z.string().max(200).optional(),
  }),
});

// ============================================================================
// Product Prices
// ============================================================================

const productPriceBodyBase = z.object({
  currency: z.string().length(3).default('INR'),
  unitAmountMinor: z.number().int().min(0).max(1_000_000_000),
  taxInclusion: z.enum(TAX_INCLUSION_VALUES).default('EXCLUSIVE'),
  billingInterval: z.enum(BILLING_INTERVAL_VALUES),
  intervalCount: z.number().int().min(1).max(120).default(1),
  trialPeriodDays: z.number().int().min(0).max(3650).optional(),
  setupFeeMinor: z.number().int().min(0).max(1_000_000_000).optional(),
  minQuantity: z.number().int().min(1).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  effectiveStartAt: z.string().datetime().optional(),
  effectiveEndAt: z.string().datetime().optional(),
  region: z.string().max(60).optional(),
  userSegment: z.string().max(60).optional(),
});

export const createProductPriceSchema = z.object({
  params: z.object({ productId: uuid() }),
  body: productPriceBodyBase,
});

export const updateProductPriceSchema = z.object({
  params: z.object({ priceId: uuid() }),
  body: productPriceBodyBase
    .partial()
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const priceIdParamSchema = z.object({ params: z.object({ priceId: uuid() }) });
export const productIdPathParamSchema = z.object({ params: z.object({ productId: uuid() }) });

// ============================================================================
// Membership Plans
// ============================================================================

export const createMembershipPlanSchema = z.object({
  body: z.object({
    code: z.string().trim().toLowerCase().regex(codePattern, 'Invalid code format').max(60),
    productId: uuid(),
    displayOrder: z.number().int().min(0).max(100000).default(0),
  }),
});

export const updateMembershipPlanSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z
    .object({
      status: z.enum(MEMBERSHIP_PLAN_STATUS_VALUES),
      displayOrder: z.number().int().min(0).max(100000),
    })
    .partial()
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const planIdParamSchema = z.object({ params: z.object({ id: uuid() }) });

export const adminPlanQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(MEMBERSHIP_PLAN_STATUS_VALUES).optional(),
  }),
});

// ============================================================================
// Plan Versions
// ============================================================================

const planVersionBodyBase = z.object({
  name: z.string().trim().min(2).max(200),
  publicDescription: z.string().max(5000).optional(),
  internalDescription: z.string().max(5000).optional(),
  targetCustomer: z.string().max(300).optional(),
  features: z.array(z.string().max(300)).max(50).default([]),
  limits: jsonSchema,
  supportedBillingIntervals: z.array(z.enum(BILLING_INTERVAL_VALUES)).max(10).default([]),
  trialEligible: z.boolean().default(false),
  trialDays: z.number().int().min(0).max(3650).optional(),
  upgradePaths: jsonSchema,
  downgradePaths: jsonSchema,
  cancellationPolicy: z.string().max(5000).optional(),
  gracePeriodPolicy: z.string().max(5000).optional(),
  refundPolicy: z.string().max(5000).optional(),
  badgeText: z.string().max(60).optional(),
  recommendedReason: z.enum(RECOMMENDED_REASON_VALUES).optional(),
});

export const createPlanVersionSchema = z.object({
  params: z.object({ planId: uuid() }),
  body: planVersionBodyBase,
});

export const updatePlanVersionSchema = z.object({
  params: z.object({ versionId: uuid() }),
  body: planVersionBodyBase
    .partial()
    .extend({ recommendedReason: z.enum(RECOMMENDED_REASON_VALUES).nullable().optional() })
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const versionIdParamSchema = z.object({ params: z.object({ versionId: uuid() }) });

// ============================================================================
// Plan Entitlements
// ============================================================================

export const createPlanEntitlementSchema = z.object({
  params: z.object({ versionId: uuid() }),
  body: z.object({
    key: z.string().trim().min(1).max(120),
    type: z.enum(ENTITLEMENT_TYPE_VALUES),
    value: z.unknown(),
    description: z.string().max(2000).optional(),
    displayOrder: z.number().int().min(0).max(100000).default(0),
  }),
});

export const updatePlanEntitlementSchema = z.object({
  params: z.object({ entitlementId: uuid() }),
  body: z
    .object({
      key: z.string().trim().min(1).max(120),
      type: z.enum(ENTITLEMENT_TYPE_VALUES),
      value: z.unknown(),
      description: z.string().max(2000).optional(),
      displayOrder: z.number().int().min(0).max(100000),
    })
    .partial()
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const entitlementIdParamSchema = z.object({ params: z.object({ entitlementId: uuid() }) });
