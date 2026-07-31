import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createBankItemForCourse,
  updateExistingBankItem,
  archiveBankItem,
  listBankItemsForCourseAdmin,
  getBankItemAdmin,
  generateQuestionsFromBank,
} from './question-bank.service';

/** POST /admin/courses/:courseId/question-bank */
export const postBankItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await createBankItemForCourse(req.params.courseId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(item));
});

/** GET /admin/courses/:courseId/question-bank */
export const getBankItemsForCourse = asyncHandler(async (req: Request, res: Response) => {
  const items = await listBankItemsForCourseAdmin(req.params.courseId, req.query);
  res.status(200).json(buildSuccessResponse(items));
});

/** GET /admin/question-bank/:itemId */
export const getBankItemByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const item = await getBankItemAdmin(req.params.itemId);
  res.status(200).json(buildSuccessResponse(item));
});

/** PATCH /admin/question-bank/:itemId */
export const patchBankItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await updateExistingBankItem(req.params.itemId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(item));
});

/** POST /admin/question-bank/:itemId/archive */
export const postArchiveBankItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await archiveBankItem(req.params.itemId, req.user!.id);
  res.status(200).json(buildSuccessResponse(item));
});

/** POST /admin/quizzes/:quizId/generate-from-bank */
export const postGenerateQuestionsFromBank = asyncHandler(async (req: Request, res: Response) => {
  const result = await generateQuestionsFromBank(req.params.quizId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(result));
});
