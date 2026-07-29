import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  getOnboardingProgress,
  submitOnboardingStep,
  completeOnboarding,
  getRoadmap,
  restartOnboarding,
} from './onboarding.service';

/** GET /api/v1/onboarding/progress — FR-090: which step to resume from. */
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const progress = await getOnboardingProgress(req.user!.id);
  res.status(200).json(buildSuccessResponse(progress));
});

/** POST /api/v1/onboarding/steps/:stepNumber — FR-078 acceptance scenario 1. */
export const postStep = asyncHandler(async (req: Request, res: Response) => {
  const response = await submitOnboardingStep({
    userId: req.user!.id,
    stepNumber: Number(req.params.stepNumber),
    answer: req.body.answer,
  });
  res.status(200).json(buildSuccessResponse(response));
});

/** POST /api/v1/onboarding/complete — FR-095: generates the Roadmap once all steps are done. */
export const postComplete = asyncHandler(async (req: Request, res: Response) => {
  const roadmap = await completeOnboarding(req.user!.id);
  res.status(200).json(buildSuccessResponse(roadmap));
});

/** GET /api/v1/onboarding/roadmap */
export const getMyRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const roadmap = await getRoadmap(req.user!.id);
  res.status(200).json(buildSuccessResponse(roadmap));
});

/** POST /api/v1/onboarding/restart */
export const postRestart = asyncHandler(async (req: Request, res: Response) => {
  await restartOnboarding(req.user!.id);
  res.status(200).json(buildSuccessResponse({ restarted: true }));
});
