import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  mfaRateLimiter,
} from '../../auth/auth-rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  mfaLoginChallengeSchema,
  mfaDisableSchema,
  revokeSessionSchema,
  roleAssignSchema,
} from '../../auth/auth.validation';
import {
  postRegister,
  postLogin,
  postRefresh,
  postLogout,
  postLogoutAll,
  postVerifyEmail,
  postResendVerification,
  postForgotPassword,
  postResetPassword,
} from '../../auth/auth.controller';
import {
  postMfaEnroll,
  postMfaConfirm,
  postMfaDisable,
  postMfaChallenge,
  postRegenerateRecoveryCodes,
} from '../../auth/mfa.controller';
import { getSessions, deleteSession } from '../../auth/session.controller';
import { getMe } from '../../auth/me.controller';
import { patchUserRole } from '../../auth/admin-identity.controller';
import { getMyLifecycleState, getMyNextBestAction } from '../../lifecycle/lifecycle.controller';

/**
 * Phase 4 — Authentication, Identity & RBAC routes. Only the endpoints
 * this phase actually implements are mounted here — see
 * docs/auth/TRACEABILITY.md for the full list of 003's named endpoint
 * groups and which are deferred (mobile OTP, social auth, passwordless).
 */
const router = Router();

// --- Public (unauthenticated) -------------------------------------------
router.post('/register', registerRateLimiter, validate(registerSchema), postRegister);
router.post('/login', loginRateLimiter, validate(loginSchema), postLogin);
router.post('/refresh', validate(refreshSchema), postRefresh);
router.post('/verify-email', validate(verifyEmailSchema), postVerifyEmail);
router.post(
  '/resend-verification',
  passwordResetRateLimiter,
  validate(resendVerificationSchema),
  postResendVerification,
);
router.post('/forgot-password', passwordResetRateLimiter, validate(forgotPasswordSchema), postForgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), postResetPassword);
router.post('/mfa/challenge', mfaRateLimiter, validate(mfaLoginChallengeSchema), postMfaChallenge);

// --- Authenticated --------------------------------------------------------
router.post('/logout', authenticate, validate(logoutSchema), postLogout);
router.post('/logout-all', authenticate, postLogoutAll);
router.post('/mfa/enroll', authenticate, mfaRateLimiter, postMfaEnroll);
router.post('/mfa/confirm', authenticate, mfaRateLimiter, validate(mfaVerifySchema), postMfaConfirm);
router.post('/mfa/disable', authenticate, validate(mfaDisableSchema), postMfaDisable);
router.post('/mfa/recovery-codes/regenerate', authenticate, postRegenerateRecoveryCodes);
router.get('/sessions', authenticate, getSessions);
router.delete('/sessions/:sessionId', authenticate, validate(revokeSessionSchema), deleteSession);

export const authRouter = router;

/**
 * GET /api/v1/me — mounted separately (not under /auth) since it
 * represents the authenticated user's own profile, not an auth action.
 */
export const meRouter = Router();
meRouter.get('/', authenticate, getMe);
/** 001 FR-014/FR-017/FR-039–046 — the user's own lifecycle state and next-best-action. */
meRouter.get('/lifecycle', authenticate, getMyLifecycleState);
meRouter.get('/next-best-action', authenticate, getMyNextBestAction);

/**
 * Admin identity routes (003 FR-130) — backend API only, no admin UI
 * built in this phase.
 */
export const adminUsersRouter = Router();
adminUsersRouter.patch(
  '/:userId/role',
  authenticate,
  requirePermission('user.role.assign'),
  validate(roleAssignSchema),
  patchUserRole,
);
