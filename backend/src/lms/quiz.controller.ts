import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createQuizForLesson,
  getQuizAdmin,
  getQuizByLessonIdAdmin,
  updateExistingQuiz,
  changeQuizStatus,
  addQuestionToQuiz,
  updateExistingQuestion,
  archiveQuestion,
  reorderQuizQuestions,
} from './quiz.service';

// --- Admin: Quiz -------------------------------------------------------

export const postQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await createQuizForLesson(req.params.lessonId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(quiz));
});

export const getQuizByLessonId = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await getQuizByLessonIdAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(quiz));
});

export const getQuizByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await getQuizAdmin(req.params.quizId);
  res.status(200).json(buildSuccessResponse(quiz));
});

export const patchQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await updateExistingQuiz(req.params.quizId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(quiz));
});

export const postQuizStatus = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await changeQuizStatus(req.params.quizId, req.body.status, req.user!.id);
  res.status(200).json(buildSuccessResponse(quiz));
});

// --- Admin: Questions ----------------------------------------------------

export const postQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await addQuestionToQuiz(req.params.quizId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(question));
});

export const patchQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await updateExistingQuestion(req.params.questionId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(question));
});

export const postArchiveQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await archiveQuestion(req.params.questionId, req.user!.id);
  res.status(200).json(buildSuccessResponse(question));
});

export const postReorderQuestions = asyncHandler(async (req: Request, res: Response) => {
  await reorderQuizQuestions(req.params.quizId, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});
