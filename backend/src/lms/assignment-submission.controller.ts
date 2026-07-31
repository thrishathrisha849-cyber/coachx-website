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
  markMyFeedbackViewed,
  replyToMyFeedback,
  requestClarificationOnMyFeedback,
  listMyFeedbackMessages,
  respondToFeedbackAdmin,
  listFeedbackMessagesAdmin,
  getAssignmentOverviewForLearner,
  submitSelfAssessment,
} from './assignment-submission.service';

/**
 * 004 US4 learner-facing assignment API. Same discipline as
 * `student-lms.controller.ts`/`quiz-attempt.controller.ts`: every handler
 * reads the acting user EXCLUSIVELY from `req.user!.id`.
 */

/** GET /me/assignments/:assignmentId — 004 Broader Assessment Types batch (FR-068): the learner's pre-submission overview, including rubric criteria. */
export const getMyAssignmentOverview = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await getAssignmentOverviewForLearner(req.user!.id, req.params.assignmentId);
  res.status(200).json(buildSuccessResponse(assignment));
});

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
  const submission = await submitSubmission(req.user!.id, req.params.submissionId, req.body.declaredOriginal, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse(submission));
});

/** POST /me/submissions/:submissionId/self-assess — 004 Broader Assessment Types batch (FR-068): SELF_ASSESSMENT/SKILL_RATING's own submit+outcome path. */
export const postSelfAssessSubmission = asyncHandler(async (req: Request, res: Response) => {
  const submission = await submitSelfAssessment(req.user!.id, req.params.submissionId, req.body);
  res.status(200).json(buildSuccessResponse(submission));
});

// --- Assignment Feedback Interaction, learner side (004, FR-078, T067) ---

/** POST /me/submissions/:submissionId/feedback/viewed */
export const postMarkFeedbackViewed = asyncHandler(async (req: Request, res: Response) => {
  const submission = await markMyFeedbackViewed(req.user!.id, req.params.submissionId);
  res.status(200).json(buildSuccessResponse(submission));
});

/** POST /me/submissions/:submissionId/feedback/reply */
export const postReplyToFeedback = asyncHandler(async (req: Request, res: Response) => {
  const message = await replyToMyFeedback(req.user!.id, req.params.submissionId, req.body.body);
  res.status(201).json(buildSuccessResponse(message));
});

/** POST /me/submissions/:submissionId/feedback/clarify */
export const postRequestClarification = asyncHandler(async (req: Request, res: Response) => {
  const message = await requestClarificationOnMyFeedback(req.user!.id, req.params.submissionId, req.body.body);
  res.status(201).json(buildSuccessResponse(message));
});

/** GET /me/submissions/:submissionId/feedback/messages */
export const getMyFeedbackMessages = asyncHandler(async (req: Request, res: Response) => {
  const messages = await listMyFeedbackMessages(req.user!.id, req.params.submissionId);
  res.status(200).json(buildSuccessResponse(messages));
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

// --- Assignment Feedback Interaction, instructor side (004, FR-078, T067) ---

/** POST /admin/submissions/:submissionId/feedback/respond */
export const postRespondToFeedbackAdmin = asyncHandler(async (req: Request, res: Response) => {
  const message = await respondToFeedbackAdmin(req.params.submissionId, req.body.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(message));
});

/** GET /admin/submissions/:submissionId/feedback/messages */
export const getFeedbackMessagesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const messages = await listFeedbackMessagesAdmin(req.params.submissionId);
  res.status(200).json(buildSuccessResponse(messages));
});
