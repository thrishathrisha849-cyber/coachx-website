import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findReviewByCourseAndUser(courseId: string, userId: string, tx?: TransactionClient) {
  return db(tx).courseReview.findUnique({ where: { courseId_userId: { courseId, userId } } });
}

export function findReviewById(id: string, tx?: TransactionClient) {
  return db(tx).courseReview.findUnique({ where: { id } });
}

export function createReview(data: Prisma.CourseReviewCreateInput, tx?: TransactionClient) {
  return db(tx).courseReview.create({ data });
}

export function updateReview(id: string, data: Prisma.CourseReviewUpdateInput, tx?: TransactionClient) {
  return db(tx).courseReview.update({ where: { id }, data });
}

export function findVisibleReviewsForCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).courseReview.findMany({
    where: { courseId, status: 'VISIBLE' },
    orderBy: { createdAt: 'desc' },
    include: { user: { include: { profile: true } } },
  });
}

export function findAllReviewsForCourseAdmin(courseId: string, tx?: TransactionClient) {
  return db(tx).courseReview.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    include: { user: { include: { profile: true } } },
  });
}

/** Aggregates over VISIBLE reviews only — a hidden review must never influence the public rating. */
export async function aggregateVisibleRatings(courseId: string, tx?: TransactionClient): Promise<{ average: number | null; count: number }> {
  const result = await db(tx).courseReview.aggregate({
    where: { courseId, status: 'VISIBLE' },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return { average: result._avg.rating, count: result._count.rating };
}
