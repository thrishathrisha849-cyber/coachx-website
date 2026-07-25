import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  startMfaEnrollment,
  confirmMfaEnrollment,
  disableMfa,
  completeMfaLogin,
  regenerateRecoveryCodes,
} from './mfa.service';

function sessionContext(req: Request) {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ipAddress: req.ip ?? null,
    deviceName: null,
  };
}

/** POST /api/v1/auth/mfa/enroll — 003 FR-052 step 1 (requires password re-entry). */
export const postMfaEnroll = asyncHandler(async (req: Request, res: Response) => {
  const result = await startMfaEnrollment(req.user!.id, req.body.password);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/auth/mfa/confirm — 003 FR-052 step 2 (verification code + recovery codes). */
export const postMfaConfirm = asyncHandler(async (req: Request, res: Response) => {
  const result = await confirmMfaEnrollment(req.user!.id, req.body.code);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/auth/mfa/disable — 003 FR-054 (password + code required). */
export const postMfaDisable = asyncHandler(async (req: Request, res: Response) => {
  await disableMfa(req.user!.id, req.body.password, req.body.code);
  res.status(200).json(buildSuccessResponse({ disabled: true }));
});

/** POST /api/v1/auth/mfa/challenge — completes login after a password-only success (003 §9). */
export const postMfaChallenge = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await completeMfaLogin(req.body.mfaChallengeToken, req.body.code, sessionContext(req));
  res.status(200).json(
    buildSuccessResponse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    }),
  );
});

/** POST /api/v1/auth/mfa/recovery-codes/regenerate — 003 FR-053. */
export const postRegenerateRecoveryCodes = asyncHandler(async (req: Request, res: Response) => {
  const codes = await regenerateRecoveryCodes(req.user!.id);
  res.status(200).json(buildSuccessResponse({ recoveryCodes: codes }));
});
