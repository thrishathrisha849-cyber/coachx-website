import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findWishlistEntry(userId: string, courseId: string, tx?: TransactionClient) {
  return db(tx).wishlistEntry.findUnique({ where: { userId_courseId: { userId, courseId } } });
}

export function createWishlistEntry(
  data: { userId: string; courseId: string; priceAtSaveAmountMinor: number; priceAtSaveCurrency: string },
  tx?: TransactionClient,
) {
  return db(tx).wishlistEntry.create({ data });
}

export async function deleteWishlistEntry(userId: string, courseId: string, tx?: TransactionClient): Promise<void> {
  await db(tx).wishlistEntry.deleteMany({ where: { userId, courseId } });
}

export function findMyWishlist(userId: string, tx?: TransactionClient) {
  return db(tx).wishlistEntry.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, priceType: true, priceAmountMinor: true, currency: true, certificateAvailable: true, status: true } } },
  });
}

/** Every wishlist entry for a course — used by the real notification hooks in `course.service.ts`. */
export function findWishlistEntriesForCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).wishlistEntry.findMany({ where: { courseId }, include: { user: { select: { id: true, email: true } } } });
}

export function markEnrollmentOpenNotified(id: string, tx?: TransactionClient) {
  return db(tx).wishlistEntry.update({ where: { id }, data: { enrollmentOpenNotifiedAt: new Date() } });
}

export function markPriceDropNotified(id: string, tx?: TransactionClient) {
  return db(tx).wishlistEntry.update({ where: { id }, data: { priceDropNotifiedAt: new Date() } });
}

/** Reset on re-entering ENROLLMENT_PAUSED, so a future re-open notifies again. */
export function resetEnrollmentOpenNotifications(courseId: string, tx?: TransactionClient) {
  return db(tx).wishlistEntry.updateMany({ where: { courseId }, data: { enrollmentOpenNotifiedAt: null } });
}
