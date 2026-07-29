import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { submitOnboarding, selectNiche, getLifecycleState } from './onboarding.service';
import { evaluateAndAdvanceStage } from './stage-transition.service';
import { resolveNextBestAction } from './next-best-action.service';
import {
  claimBusinessMilestone,
  listClaimedMilestonesForReview,
  verifyBusinessMilestone,
  rejectBusinessMilestone,
} from './milestone.service';

/** POST /api/v1/lifecycle/onboarding — 001 FR-017. */
export const postOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const state = await submitOnboarding(req.user!.id, req.body);
  await evaluateAndAdvanceStage(req.user!.id);
  res.status(200).json(buildSuccessResponse(state));
});

/** POST /api/v1/lifecycle/niche */
export const postSelectNiche = asyncHandler(async (req: Request, res: Response) => {
  const state = await selectNiche(req.user!.id, req.body.niche);
  res.status(200).json(buildSuccessResponse(state));
});

/** GET /api/v1/me/lifecycle — the authenticated user's own lifecycle state. */
export const getMyLifecycleState = asyncHandler(async (req: Request, res: Response) => {
  const state = await getLifecycleState(req.user!.id);
  res.status(200).json(buildSuccessResponse(state));
});

/** GET /api/v1/me/next-best-action — 001 FR-014. */
export const getMyNextBestAction = asyncHandler(async (req: Request, res: Response) => {
  const action = await resolveNextBestAction(req.user!.id);
  res.status(200).json(buildSuccessResponse(action));
});

/** POST /api/v1/lifecycle/milestones — 001 FR-045 (claim only, never auto-verified). */
export const postClaimMilestone = asyncHandler(async (req: Request, res: Response) => {
  const milestone = await claimBusinessMilestone(req.user!.id, req.body.type, req.body.evidence);
  res.status(201).json(buildSuccessResponse(milestone));
});

/** GET /api/v1/admin/milestones — `milestone.verify` holders only. */
export const getMilestonesForReview = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const result = await listClaimedMilestonesForReview(page, pageSize);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/admin/milestones/:milestoneId/verify */
export const postVerifyMilestone = asyncHandler(async (req: Request, res: Response) => {
  const milestone = await verifyBusinessMilestone(req.params.milestoneId, req.user!.id);
  res.status(200).json(buildSuccessResponse(milestone));
});

/** POST /api/v1/admin/milestones/:milestoneId/reject */
export const postRejectMilestone = asyncHandler(async (req: Request, res: Response) => {
  const milestone = await rejectBusinessMilestone(req.params.milestoneId, req.user!.id, req.body.reason);
  res.status(200).json(buildSuccessResponse(milestone));
});
