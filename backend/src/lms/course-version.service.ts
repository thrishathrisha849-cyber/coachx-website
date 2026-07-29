import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';
import type { Course } from '@prisma/client';

function db(tx?: TransactionClient) {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

/**
 * 001 FR-099, Constitution Article IV — closes the gap the schema's own
 * `Course.version` counter comment flagged ("not yet enforced... no
 * concurrent-edit UI exists yet"): whenever a course that is already
 * PUBLISHED is edited, a full non-destructive snapshot is taken FIRST,
 * mirroring `createPageVersion`'s exact pattern (append-only, never
 * overwritten). A course that has never been published has nothing to
 * preserve yet — only PUBLISHED-then-edited content triggers a snapshot.
 */
export async function snapshotCourseIfPublished(course: Course, actorId: string, tx?: TransactionClient): Promise<void> {
  if (course.status !== 'PUBLISHED') return;

  const versionCount = await db(tx).courseVersion.count({ where: { courseId: course.id } });

  await db(tx).courseVersion.create({
    data: {
      courseId: course.id,
      versionNumber: versionCount + 1,
      snapshot: course as never,
      createdBy: actorId,
    },
  });
}

export function listCourseVersions(courseId: string, tx?: TransactionClient) {
  return db(tx).courseVersion.findMany({ where: { courseId }, orderBy: { versionNumber: 'desc' } });
}
