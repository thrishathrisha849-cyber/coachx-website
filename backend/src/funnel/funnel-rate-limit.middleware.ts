import rateLimit from 'express-rate-limit';

/** 002 FR-103: rate limiting for public funnel forms — same pattern as `cms-rate-limit.middleware.ts`/`auth-rate-limit.middleware.ts`. */

export const leadCaptureRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please try again later.' } },
});

export const masterclassRegistrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
});
