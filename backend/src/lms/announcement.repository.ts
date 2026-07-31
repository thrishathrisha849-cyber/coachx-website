import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findAnnouncementById(id: string, tx?: TransactionClient) {
  return db(tx).courseAnnouncement.findUnique({ where: { id } });
}

export function createAnnouncement(data: Prisma.CourseAnnouncementCreateInput, tx?: TransactionClient) {
  return db(tx).courseAnnouncement.create({ data });
}

export function updateAnnouncement(id: string, data: Prisma.CourseAnnouncementUpdateInput, tx?: TransactionClient) {
  return db(tx).courseAnnouncement.update({ where: { id }, data });
}

export function findAnnouncementsForCourseAdmin(courseId: string, tx?: TransactionClient) {
  return db(tx).courseAnnouncement.findMany({ where: { courseId }, orderBy: { createdAt: 'desc' } });
}

/**
 * PUBLISHED, in-window (publishAt/expireAt evaluated at read time — no
 * background worker needed, same pattern `isCoursePubliclyVisible`'s
 * publish-window check already established), scoped to the whole course
 * (moduleId null) or one specific module.
 */
export function findVisibleAnnouncementsForCourse(courseId: string, tx?: TransactionClient) {
  const now = new Date();
  return db(tx).courseAnnouncement.findMany({
    where: {
      courseId,
      status: 'PUBLISHED',
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      AND: [{ OR: [{ expireAt: null }, { expireAt: { gt: now } }] }],
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}
