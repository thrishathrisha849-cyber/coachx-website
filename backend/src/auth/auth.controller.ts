import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { register } from './registration.service';
import { login } from './login.service';
import { rotateSession, revokeCurrentSession, revokeAllSessions } from './session.service';
import { verifyEmail, resendVerificationEmail } from './email-verification.service';
import { requestPasswordReset, resetPassword } from './password-reset.service';

function sessionContext(req: Request) {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ipAddress: req.ip ?? null,
    deviceName: null,
  };
}

/**
 * POST /api/v1/auth/register — 003 User Story 1 (FR-008, FR-011, FR-013–024).
 * Safe response payload: only userId/email/status/verificationRequired —
 * never a password hash or internal security field (Phase 4 brief §3).
 */
export const postRegister = asyncHandler(async (req: Request, res: Response) => {
  const result = await register({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    idempotencyKey: req.header('Idempotency-Key') ?? undefined,
    correlationId: req.id,
    requestId: req.id,
  });

  res.status(201).json(buildSuccessResponse(result));
});

/**
 * POST /api/v1/auth/login — 003 User Story 3 (FR-037–FR-041).
 * Returns either a full token pair or an MFA challenge — never leaks
 * which specific field was wrong on failure (FR-040).
 */
export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await login({
    email: req.body.email,
    password: req.body.password,
    context: sessionContext(req),
    correlationId: req.id,
    requestId: req.id,
  });

  if (result.status === 'mfa_required') {
    res.status(200).json(
      buildSuccessResponse({ mfaRequired: true, mfaChallengeToken: result.mfaChallengeToken }),
    );
    return;
  }

  res.status(200).json(
    buildSuccessResponse({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      expiresAt: result.tokens.expiresAt,
      // FR-050: the caller (frontend) should force the MFA-enrollment
      // flow when this is true — see docs/auth/PASSWORD_ACCOUNT_SECURITY_POLICY.md.
      mfaSetupRequired: result.mfaSetupRequired,
    }),
  );
});

/** POST /api/v1/auth/refresh — 003 FR-056 (rotation + reuse detection). */
export const postRefresh = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await rotateSession(req.body.refreshToken);

  res.status(200).json(
    buildSuccessResponse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    }),
  );
});

/** POST /api/v1/auth/logout — 003 FR-059 (current session only). */
export const postLogout = asyncHandler(async (req: Request, res: Response) => {
  // The caller authenticates this call with their access token (via
  // `authenticate` middleware — req.user.sessionId), not the refresh
  // token itself, so a logout call cannot be forged by anyone who merely
  // intercepted a refresh token without also holding a valid access token.
  await revokeCurrentSession(req.user!.sessionId);
  res.status(200).json(buildSuccessResponse({ loggedOut: true }));
});

/** POST /api/v1/auth/logout-all — 003 FR-059 (all devices). */
export const postLogoutAll = asyncHandler(async (req: Request, res: Response) => {
  await revokeAllSessions(req.user!.id, 'user_logout_all_devices');
  res.status(200).json(buildSuccessResponse({ loggedOut: true }));
});

/** POST /api/v1/auth/verify-email — 003 FR-024–FR-025. */
export const postVerifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyEmail(req.body.token);
  res.status(200).json(buildSuccessResponse({ verified: true, userId: result.userId }));
});

/** POST /api/v1/auth/resend-verification — 003 FR-026 (enumeration-safe). */
export const postResendVerification = asyncHandler(async (req: Request, res: Response) => {
  await resendVerificationEmail(req.body.email);
  // SC-003-style generic acknowledgement — identical regardless of match.
  res.status(200).json(
    buildSuccessResponse({ message: 'If an unverified account matches this email, a new verification link was sent.' }),
  );
});

/** POST /api/v1/auth/forgot-password — 003 FR-043, SC-003. */
export const postForgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await requestPasswordReset(req.body.email, req.ip ?? null);
  res.status(200).json(
    buildSuccessResponse({ message: 'If an account matches this email, password reset instructions were sent.' }),
  );
});

/** POST /api/v1/auth/reset-password — 003 FR-045–FR-047. */
export const postResetPassword = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body.token, req.body.newPassword, req.body.confirmNewPassword);
  res.status(200).json(buildSuccessResponse({ reset: true }));
});
