import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { findUserById } from './auth.repository';
import { getPrismaClient } from '../database/prisma-client';

/**
 * GET /api/v1/me — the authenticated user's own identity summary. Safe
 * response payload only: no password hash, no MFA secret, no raw tokens.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await findUserById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');

  const db = getPrismaClient();
  const profile = db ? await db.userProfile.findUnique({ where: { userId: user.id } }) : null;

  res.status(200).json(
    buildSuccessResponse({
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      displayName: profile?.displayName ?? null,
      roles: req.user!.roles,
      createdAt: user.createdAt,
    }),
  );
});
