import { z } from 'zod';

/**
 * Zod request-validation schemas — the existing project standard (already
 * used by `env.config.ts` since Phase 1/2). FR citations per field are
 * documented alongside the corresponding service, not repeated here.
 */

export const registerSchema = z.object({
  body: z.object({
    // FR-016: trimmed, min 2 chars, single-word names allowed.
    name: z.string().trim().min(2).max(120),
    // FR-017: lowercase-normalized at the service layer, format-validated here.
    email: z.string().trim().min(3).max(255).email(),
    // FR-013/FR-019: policy enforced in password.util.ts (needs email/name context, not just shape).
    password: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255),
    // FR-020: explicit, non-preselected acceptance required.
    acceptedTerms: z.literal(true),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    // FR-038: single identifier field. Phase 4 scope is email-only (see
    // docs/auth/TRACEABILITY.md) — mobile-identifier auto-detection is deferred.
    email: z.string().trim().min(3).max(255).email(),
    password: z.string().min(1).max(255),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().trim().min(3).max(255).email(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().min(3).max(255).email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(255),
    confirmNewPassword: z.string().min(8).max(255),
  }),
});

export const mfaVerifySchema = z.object({
  body: z.object({
    code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
  }),
});

export const mfaLoginChallengeSchema = z.object({
  body: z.object({
    mfaChallengeToken: z.string().min(1),
    code: z.string().min(6).max(20), // 6-digit TOTP code OR a recovery code
  }),
});

export const mfaDisableSchema = z.object({
  body: z.object({
    password: z.string().min(1),
    code: z.string().min(6).max(20),
  }),
});

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid(),
  }),
});

export const roleAssignSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
  body: z.object({
    role: z.string().min(1).max(50),
    reason: z.string().trim().min(1).max(500),
  }),
});
