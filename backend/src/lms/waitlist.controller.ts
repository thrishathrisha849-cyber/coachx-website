import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { joinWaitlist, getMyWaitlistStatus, claimWaitlistOffer, listWaitlistForCourseAdmin } from './waitlist.service';

// --- Learner-facing (004 Waitlist batch, FR-028/029) -----------------------

export const postJoinWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const entry = await joinWaitlist(req.user!.id, req.params.courseId, req.body.referralSource);
  res.status(201).json(buildSuccessResponse(entry));
});

export const getMyWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await getMyWaitlistStatus(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(entry));
});

export const postClaimWaitlistOffer = asyncHandler(async (req: Request, res: Response) => {
  const entry = await claimWaitlistOffer(req.user!.id, req.params.id);
  res.status(200).json(buildSuccessResponse(entry));
});

// --- Admin -------------------------------------------------------------------

export const getWaitlistForCourseAdmin = asyncHandler(async (req: Request, res: Response) => {
  const entries = await listWaitlistForCourseAdmin(req.params.courseId);
  res.status(200).json(buildSuccessResponse(entries));
});
