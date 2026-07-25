import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { getActiveSessions, revokeSpecificSession } from './session.service';

/** GET /api/v1/auth/sessions — 003 FR-060 ("Devices and Sessions" screen data). */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await getActiveSessions(req.user!.id);

  // Safe response payload: never the refresh-token hash.
  const safeSessions = sessions.map((s) => ({
    id: s.id,
    deviceName: s.deviceName,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    isCurrent: s.id === req.user!.sessionId,
  }));

  res.status(200).json(buildSuccessResponse(safeSessions));
});

/** DELETE /api/v1/auth/sessions/:sessionId — 003 FR-061 (remove-access per device). */
export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  await revokeSpecificSession(req.user!.id, req.params.sessionId);
  res.status(200).json(buildSuccessResponse({ revoked: true }));
});
