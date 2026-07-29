import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { fileTrustSafetyCase } from './reporting.service';
import { submitAppeal } from './appeal.service';

/** POST /api/v1/trust-safety/cases — 001 FR-090 (report/block/mute; every authenticated user). */
export const postFileCase = asyncHandler(async (req: Request, res: Response) => {
  const trustSafetyCase = await fileTrustSafetyCase({
    type: req.body.type,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    reportedUserId: req.body.reportedUserId,
    reason: req.body.reason,
    evidence: req.body.evidence,
    reporterId: req.user!.id,
  });
  res.status(201).json(buildSuccessResponse(trustSafetyCase));
});

/** POST /api/v1/trust-safety/cases/:caseId/appeal — 001 FR-092 (the affected user only). */
export const postSubmitAppeal = asyncHandler(async (req: Request, res: Response) => {
  const appeal = await submitAppeal(req.params.caseId, req.user!.id, req.body.statement);
  res.status(201).json(buildSuccessResponse(appeal));
});
