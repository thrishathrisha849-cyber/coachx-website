import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { saveToWishlist, removeFromWishlist, listMyWishlist } from './wishlist.service';

// --- Learner-facing (004 Wishlist batch, FR-027) ----------------------------

export const postSaveToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const entry = await saveToWishlist(req.user!.id, req.params.courseId);
  res.status(201).json(buildSuccessResponse(entry));
});

export const deleteFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  await removeFromWishlist(req.user!.id, req.params.courseId);
  res.status(204).send();
});

export const getMyWishlist = asyncHandler(async (req: Request, res: Response) => {
  const entries = await listMyWishlist(req.user!.id);
  res.status(200).json(buildSuccessResponse(entries));
});
