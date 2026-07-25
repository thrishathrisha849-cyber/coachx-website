import rateLimit from 'express-rate-limit';

/**
 * Public-form rate limits (002 FR-103: "rate limiting, bot protection,
 * form spam protection"). Same pattern as
 * `backend/src/auth/auth-rate-limit.middleware.ts`.
 */

export const contactFormRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please try again later.' } },
});

export const newsletterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many search requests. Please slow down.' } },
});
