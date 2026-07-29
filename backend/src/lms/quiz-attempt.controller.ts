import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  getQuizOverviewForLearner,
  startOrResumeAttempt,
  getAttemptForLearner,
  saveAnswer,
  submitAttempt,
} from './quiz-attempt.service';

/**
 * 004 US3 learner-facing quiz API. Same discipline as
 * `student-lms.controller.ts`: every handler reads the acting user
 * EXCLUSIVELY from `req.user!.id` — no route accepts a caller-supplied
 * `userId` anywhere.
 */

/** GET /me/quizzes/:quizId */
export const getMyQuizOverview = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await getQuizOverviewForLearner(req.user!.id, req.params.quizId);
  res.status(200).json(buildSuccessResponse(quiz));
});

/** POST /me/quizzes/:quizId/attempts — starts a new attempt or resumes the existing IN_PROGRESS one. */
export const postStartAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await startOrResumeAttempt(req.user!.id, req.params.quizId);
  res.status(200).json(buildSuccessResponse(attempt));
});

/** GET /me/quiz-attempts/:attemptId */
export const getMyAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await getAttemptForLearner(req.user!.id, req.params.attemptId);
  res.status(200).json(buildSuccessResponse(attempt));
});

/** POST /me/quiz-attempts/:attemptId/answers/:questionId */
export const postSaveAnswer = asyncHandler(async (req: Request, res: Response) => {
  await saveAnswer(req.user!.id, req.params.attemptId, req.params.questionId, req.body);
  res.status(200).json(buildSuccessResponse({ saved: true }));
});

/** POST /me/quiz-attempts/:attemptId/submit */
export const postSubmitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const result = await submitAttempt(req.user!.id, req.params.attemptId, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse(result));
});
