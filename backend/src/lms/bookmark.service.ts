import { AppError } from '../utils/app-error';
import { findActivityById } from './activity.repository';
import { assertLessonContentAccessible } from './access-evaluator.service';
import {
  createBookmark,
  deleteBookmark,
  findBookmarksForLesson,
  findBookmarksForCourse,
  type CreatableBookmarkType,
} from './bookmark.repository';
import { toMyBookmark } from './bookmark.serializers';
import type { MyBookmark } from './bookmark.types';

/**
 * 004 Learner Notes & Bookmarks batch (FR-059). Same privacy model as
 * `learner-note.service.ts` — STRICTLY private, no admin-facing read
 * endpoint exists anywhere (FR-033). `DISCUSSION` is a real enum member
 * (schema completeness for a future Community-backed bookmark type — see
 * `docs/lms` T045) but is rejected by `bookmark.validation.ts`'s Zod
 * schema before it ever reaches this service — no Discussion entity
 * exists in this codebase yet (spec 005). Creating a bookmark requires
 * REAL lesson access, the same gate every other content-consumption
 * endpoint uses; reading/removing an existing bookmark is ownership-
 * scoped only.
 */

export interface CreateBookmarkOptions {
  type: CreatableBookmarkType;
  videoTimestampSeconds?: number;
  textSectionAnchor?: string;
  activityId?: string;
  note?: string;
  folder?: string;
}

/** POST /me/lessons/:lessonId/bookmarks */
export async function createBookmarkForLesson(userId: string, lessonId: string, options: CreateBookmarkOptions): Promise<MyBookmark> {
  const { courseId } = await assertLessonContentAccessible(userId, lessonId);

  if (options.type === 'RESOURCE') {
    if (!options.activityId) throw AppError.badRequest('activityId is required for a RESOURCE bookmark');
    const activity = await findActivityById(options.activityId);
    if (!activity || activity.lessonId !== lessonId) {
      throw AppError.badRequest('activityId must belong to this lesson');
    }
  }

  const bookmark = await createBookmark({
    userId,
    lessonId,
    courseId,
    type: options.type,
    videoTimestampSeconds: options.videoTimestampSeconds ?? null,
    textSectionAnchor: options.textSectionAnchor ?? null,
    activityId: options.type === 'RESOURCE' ? options.activityId! : null,
    note: options.note ?? null,
    folder: options.folder ?? null,
  });
  return toMyBookmark(bookmark);
}

/** DELETE /me/bookmarks/:bookmarkId — idempotent (a "toggle bookmark off" UX). */
export async function removeMyBookmark(userId: string, bookmarkId: string): Promise<void> {
  await deleteBookmark(bookmarkId, userId);
}

/** GET /me/lessons/:lessonId/bookmarks */
export async function listMyBookmarksForLesson(userId: string, lessonId: string): Promise<MyBookmark[]> {
  const rows = await findBookmarksForLesson(userId, lessonId);
  return rows.map((r) => toMyBookmark(r));
}

/** GET /me/courses/:courseId/bookmarks */
export async function listMyBookmarksForCourse(userId: string, courseId: string): Promise<MyBookmark[]> {
  const rows = await findBookmarksForCourse(userId, courseId);
  return rows.map((r) => toMyBookmark(r));
}
