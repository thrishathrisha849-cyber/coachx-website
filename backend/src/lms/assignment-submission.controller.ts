import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  startOrResumeSubmission,
  saveDraft,
  submitSubmission,
  getMySubmissionHistory,
  getMySubmissionWithScores,
  listSubmissionsForAssignmentAdmin,
  getSubmissionAdmin,
  reviewSubmission,
} from './assignment-submission.service';

/**
 * 004 US4 learner-facing assignment API. Same discipline as
 * `student-lms.controller.ts`/`quiz-attempt.controller.ts`: every handler
 * reads the acting user EXCLUSIVELY from `req.user!.id`.
 */

/** POST /me/assignments/:assignmentId/submissions — starts a new draft or resumes/returns the current one. */
export const postStartSubmission = asyncHandler(async (req: Request, res: Response) => {
  const submission = await startOrResumeSubmission(req.user!.id, req.params.assignmentId);
  res.status(200).json(buildSuccessResponse(submission));
});

/** GET /me/assignments/:assignmentId/submissions — full attempt history (resubmissions stay visible). */
export const getMySubmissions = asyncHandler(async (req: Request, res: Response) => {
  const history = await getMySubmissionHistory(req.user!.id, req.params.assignmentId);
  res.status(200).json(buildSuccessResponse(history));
});

/** GET /me/submissions/:submissionId */
export const getMySubmissionDetail = asyncHandler(async (req: Request, res: Response) => {
  const submission = await getMySubmissionWithScores(req.user!.id, req.params.submissionId);
  res.status(200).json(buildSuccessResponse(submission));
});

/** PATCH /me/submissions/:submissionId — save draft. */
export const patchMySubmission = asyncHandler(async (req: Request, res: Response) => {
  const submission = await saveDraft(req.user!.id, req.params.submissionId, req.body);
  res.status(200).json(buildSuccessResponse(submission));
});

/** POST /me/submissions/:submissionId/submit */
export const postSubmitSubmission = asyncHandler(async (req: Request, res: Response) => {
  const submission = await submitSubmission(req.user!.id, req.params.submissionId, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse(submission));
});

// --- Admin/reviewer-facing (reuses `course.module.manage`) -----------------

/** GET /admin/assignments/:assignmentId/submissions?status=... */
export const getSubmissionsForReview = asyncHandler(async (req: Request, res: Response) => {
  const submissions = await listSubmissionsForAssignmentAdmin(req.params.assignmentId, req.query.status as string | undefined);
  res.status(200).json(buildSuccessResponse(submissions));
});

/** GET /admin/submissions/:submissionId */
export const getSubmissionByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const submission = await getSubmissionAdmin(req.params.submissionId);
  res.status(200).json(buildSuccessResponse(submission));
});

/** POST /admin/submissions/:submissionId/review */
export const postReviewSubmission = asyncHandler(async (req: Request, res: Response) => {
  const submission = await reviewSubmission(req.params.submissionId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(submission));
});
