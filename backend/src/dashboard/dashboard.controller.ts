import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { getDashboard } from './dashboard.service';

/** GET /api/v1/dashboard — 003 US4/FR-099. */
export const getMyDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await getDashboard(req.user!.id);
  res.status(200).json(buildSuccessResponse(dashboard));
});
