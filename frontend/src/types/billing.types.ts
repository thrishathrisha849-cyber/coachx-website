/** Frontend mirror of backend/src/billing/billing.types.ts's public-safe shapes. */

export interface PlanEntitlement {
  key: string;
  type: string;
  value: unknown;
  description: string | null;
  displayOrder: number;
}

export interface PlanVersion {
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
  entitlements: PlanEntitlement[];
}

export interface ProductPrice {
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

export interface MembershipPlan {
  id: string;
  code: string;
  displayOrder: number;
  productId: string;
  currentVersion: PlanVersion;
  prices: ProductPrice[];
}
