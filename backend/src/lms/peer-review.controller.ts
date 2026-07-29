import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  getPeerReviewQueueForLearner,
  claimPeerReview,
  submitPeerReview,
  getPeerReviewsForSubmitter,
  moderatePeerReview,
} from './peer-review.service';

// --- Learner-facing (004 US9 Peer Review batch, FR-076) -------------------

/** GET /me/peer-review-queue */
export const getMyPeerReviewQueue = asyncHandler(async (req: Request, res: Response) => {
  const queue = await getPeerReviewQueueForLearner(req.user!.id);
  res.status(200).json(buildSuccessResponse(queue));
});

/** POST /me/submissions/:submissionId/peer-review — claim an open review slot. */
export const postClaimPeerReview = asyncHandler(async (req: Request, res: Response) => {
  const claim = await claimPeerReview(req.user!.id, req.params.submissionId);
  res.status(201).json(buildSuccessResponse(claim));
});

/** POST /me/peer-reviews/:peerReviewId/submit */
export const postSubmitPeerReview = asyncHandler(async (req: Request, res: Response) => {
  const result = await submitPeerReview(req.user!.id, req.params.peerReviewId, req.body);
  res.status(200).json(buildSuccessResponse(result));
});

/** GET /me/submissions/:submissionId/peer-reviews — reviews received on the learner's OWN submission. */
export const getMyPeerReviewsReceived = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await getPeerReviewsForSubmitter(req.user!.id, req.params.submissionId);
  res.status(200).json(buildSuccessResponse(reviews));
});

// --- Admin/instructor moderation -------------------------------------------

/** POST /admin/peer-reviews/:peerReviewId/moderate — HIDE/RESTORE, never delete. */
export const postModeratePeerReview = asyncHandler(async (req: Request, res: Response) => {
  await moderatePeerReview(req.params.peerReviewId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse({ moderated: true }));
});
