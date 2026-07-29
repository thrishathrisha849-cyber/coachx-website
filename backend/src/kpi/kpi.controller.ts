import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { collectKpiReport } from './kpi-collector.service';

/** GET /api/v1/admin/kpi — 001 FR-064–FR-068 (`kpi.view` — finance_admin/platform_admin/super_admin). */
export const getKpiReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await collectKpiReport();
  res.status(200).json(buildSuccessResponse(report));
});
