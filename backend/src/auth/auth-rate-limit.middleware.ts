import rateLimit from 'express-rate-limit';

/**
 * Stricter, auth-specific rate limits layered on top of the app-wide
 * limiter already applied in `app.ts` (Phase 2). Brute-force/credential-
 * stuffing defense (Phase 4 brief §13) needs a tighter ceiling than the
 * general API surface — these are deliberately small, fixed numbers
 * (not sourced from `config.rateLimit`, which governs the general API)
 * since a sensible default here does not need to be environment-tunable
 * the way general API throughput does.
 */

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' } },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
});

export const mfaRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many verification attempts. Please try again later.' } },
});
