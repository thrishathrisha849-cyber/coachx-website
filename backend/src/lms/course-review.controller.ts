import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  submitOrUpdateReview,
  listPublicReviews,
  getMyReview,
  evaluateReviewEligibility,
  listReviewsForCourseAdmin,
  moderateReview,
} from './course-review.service';

/** 004 Discovery & Recommendations batch (FR-087) — public/learner-facing endpoints. */

export const getCourseReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await listPublicReviews(req.params.courseId);
  res.status(200).json(buildSuccessResponse(reviews));
});

export const getMyCourseReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await getMyReview(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(review));
});

export const getMyReviewEligibility = asyncHandler(async (req: Request, res: Response) => {
  const eligibility = await evaluateReviewEligibility(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(eligibility));
});

export const postMyCourseReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await submitOrUpdateReview(req.user!.id, req.params.courseId, req.body);
  res.status(201).json(buildSuccessResponse(review));
});

// --- Admin moderation --------------------------------------------------

export const getCourseReviewsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await listReviewsForCourseAdmin(req.params.courseId);
  res.status(200).json(buildSuccessResponse(reviews));
});

export const postModerateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await moderateReview(req.params.reviewId, req.body.action, req.body.reason, req.user!.id);
  res.status(200).json(buildSuccessResponse(review));
});
