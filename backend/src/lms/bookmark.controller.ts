import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { createBookmarkForLesson, removeMyBookmark, listMyBookmarksForLesson, listMyBookmarksForCourse } from './bookmark.service';

// --- Learner-facing (004 Learner Notes & Bookmarks batch, FR-059) ----------
// STRICTLY private — no admin-facing controller exists for this entity at all (FR-033).

export const postLessonBookmark = asyncHandler(async (req: Request, res: Response) => {
  const bookmark = await createBookmarkForLesson(req.user!.id, req.params.lessonId, req.body);
  res.status(201).json(buildSuccessResponse(bookmark));
});

export const deleteMyBookmark = asyncHandler(async (req: Request, res: Response) => {
  await removeMyBookmark(req.user!.id, req.params.bookmarkId);
  res.status(204).send();
});

export const getMyLessonBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const bookmarks = await listMyBookmarksForLesson(req.user!.id, req.params.lessonId);
  res.status(200).json(buildSuccessResponse(bookmarks));
});

export const getMyCourseBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const bookmarks = await listMyBookmarksForCourse(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(bookmarks));
});
