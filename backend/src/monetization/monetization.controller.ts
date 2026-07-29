import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { REVENUE_STREAMS } from './revenue-stream.constants';

/** GET /api/v1/monetization/revenue-streams — 001 FR-054–FR-063 catalog (public, informational). */
export const getRevenueStreams = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(buildSuccessResponse(REVENUE_STREAMS));
});
