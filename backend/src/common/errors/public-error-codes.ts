/**
 * 002 FR-116: the standard public-facing error codes surfaced by the
 * public website's funnel/checkout flows. Existing generic codes
 * (`VALIDATION_ERROR`, `UNAUTHORIZED`, `RATE_LIMITED` from
 * `@coachx/shared`) are reused where FR-116's code is a synonym of one
 * already in use (`INVALID_FORM` → `VALIDATION_ERROR`, `AUTH_REQUIRED` →
 * `UNAUTHORIZED`) rather than duplicated — this file adds only the
 * funnel-specific codes that don't already exist anywhere in the
 * codebase, following the same per-feature-module convention
 * `auth-error-codes.ts` already established.
 */
export const PUBLIC_ERROR_CODES = {
  DUPLICATE_REGISTRATION: 'DUPLICATE_REGISTRATION',
  EVENT_FULL: 'EVENT_FULL',
  OFFER_EXPIRED: 'OFFER_EXPIRED',
  COUPON_INVALID: 'COUPON_INVALID',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
} as const;

export type PublicErrorCode = (typeof PUBLIC_ERROR_CODES)[keyof typeof PUBLIC_ERROR_CODES];
