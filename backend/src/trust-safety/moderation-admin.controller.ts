import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { listModerationQueue, actionCase, dismissCase } from './moderation.service';
import { resolveAppealDecision } from './appeal.service';

/** GET /api/v1/admin/moderation/cases — `community.moderate` holders only. */
export const getModerationQueue = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const result = await listModerationQueue(page, pageSize);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/admin/moderation/cases/:caseId/action */
export const postActionCase = asyncHandler(async (req: Request, res: Response) => {
  const result = await actionCase({
    caseId: req.params.caseId,
    actionType: req.body.actionType,
    actionReason: req.body.actionReason,
    suspensionDurationMin: req.body.suspensionDurationMin,
    moderatorId: req.user!.id,
  });
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/admin/moderation/cases/:caseId/dismiss */
export const postDismissCase = asyncHandler(async (req: Request, res: Response) => {
  const result = await dismissCase(req.params.caseId, req.user!.id, req.body.reason);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/admin/moderation/appeals/:appealId/resolve */
export const postResolveAppeal = asyncHandler(async (req: Request, res: Response) => {
  const result = await resolveAppealDecision(req.params.appealId, req.user!.id, req.body.decision, req.body.resolutionNote);
  res.status(200).json(buildSuccessResponse(result));
});
