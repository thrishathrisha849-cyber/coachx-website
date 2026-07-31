import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export type CreatableBookmarkType = 'LESSON' | 'VIDEO_TIMESTAMP' | 'TEXT_SECTION' | 'RESOURCE';

export interface CreateBookmarkInput {
  userId: string;
  lessonId: string;
  courseId: string;
  type: CreatableBookmarkType;
  videoTimestampSeconds: number | null;
  textSectionAnchor: string | null;
  activityId: string | null;
  note: string | null;
  folder: string | null;
}

export function createBookmark(data: CreateBookmarkInput, tx?: TransactionClient) {
  return db(tx).bookmark.create({ data });
}

export function findBookmarkById(id: string, tx?: TransactionClient) {
  return db(tx).bookmark.findUnique({ where: { id } });
}

/** Ownership-scoped delete — deleting an already-gone/not-owned bookmark is a no-op, never a 500 (a "toggle bookmark off" UX). */
export async function deleteBookmark(id: string, userId: string, tx?: TransactionClient): Promise<number> {
  const result = await db(tx).bookmark.deleteMany({ where: { id, userId } });
  return result.count;
}

export function findBookmarksForLesson(userId: string, lessonId: string, tx?: TransactionClient) {
  return db(tx).bookmark.findMany({ where: { userId, lessonId }, orderBy: { createdAt: 'desc' } });
}

export function findBookmarksForCourse(userId: string, courseId: string, tx?: TransactionClient) {
  return db(tx).bookmark.findMany({
    where: { userId, courseId },
    orderBy: { createdAt: 'desc' },
    include: { lesson: { select: { title: true, slug: true } } },
  });
}
