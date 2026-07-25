/**
 * Cross-cutting API constants shared by every CoachX client and service.
 * Business-domain constants (roles, permissions, membership tiers, etc.)
 * are intentionally NOT defined here — they belong to their owning
 * feature module, added in a later implementation phase.
 */
export const API_VERSION_V1 = 'v1' as const;

export const API_PREFIX = '/api' as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
