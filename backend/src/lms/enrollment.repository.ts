import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

const enrollmentInclude = {
  course: { select: { id: true, title: true, slug: true, priceType: true, status: true } },
  user: { include: { profile: true } },
} satisfies Prisma.EnrollmentInclude;

export function findEnrollmentById(id: string, tx?: TransactionClient) {
  return db(tx).enrollment.findUnique({ where: { id }, include: enrollmentInclude });
}

/** The active-or-pending-or-suspended enrollment for (userId, courseId), if any — mirrors the partial unique index's scope exactly. */
export function findOpenEnrollment(userId: string, courseId: string, tx?: TransactionClient) {
  return db(tx).enrollment.findFirst({
    where: { userId, courseId, status: { in: ['PENDING', 'ACTIVE', 'SUSPENDED'] } },
    include: enrollmentInclude,
  });
}

export function findEnrollmentForUserAndCourse(userId: string, courseId: string, tx?: TransactionClient) {
  return db(tx).enrollment.findFirst({
    where: { userId, courseId },
    orderBy: { createdAt: 'desc' },
    include: enrollmentInclude,
  });
}

export function findEnrollmentsForUser(userId: string, tx?: TransactionClient) {
  return db(tx).enrollment.findMany({ where: { userId }, orderBy: { enrolledAt: 'desc' }, include: enrollmentInclude });
}

export interface AdminEnrollmentFilter {
  courseId?: string;
  userId?: string;
  status?: string;
}

export function findEnrollmentsAdmin(
  filter: AdminEnrollmentFilter,
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  const where: Prisma.EnrollmentWhereInput = {
    ...(filter.courseId ? { courseId: filter.courseId } : {}),
    ...(filter.userId ? { userId: filter.userId } : {}),
    ...(filter.status ? { status: filter.status as never } : {}),
  };
  return Promise.all([
    db(tx).enrollment.findMany({
      where,
      include: enrollmentInclude,
      orderBy: [{ enrolledAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    db(tx).enrollment.count({ where }),
  ]);
}

/** Enrollments for a specific course — used by the instructor-scoped "my course's learners" read. */
export function findEnrollmentsForCourse(courseId: string, pagination: { skip: number; take: number }, tx?: TransactionClient) {
  const where: Prisma.EnrollmentWhereInput = { courseId };
  return Promise.all([
    db(tx).enrollment.findMany({
      where,
      include: enrollmentInclude,
      orderBy: [{ enrolledAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    db(tx).enrollment.count({ where }),
  ]);
}

/** FR-028 capacity check — counts every "seat-occupying" enrollment (open OR completed; a completed learner's historical seat still counts against a hard cap, matching the spec's "maximum enrollments" wording rather than only counting currently-active learners). Cancelled/revoked/expired enrollments free their seat, per FR-028's own "release seats on cancellation... expiry" text. */
export function countSeatOccupyingEnrollments(courseId: string, tx?: TransactionClient) {
  return db(tx).enrollment.count({
    where: { courseId, status: { in: ['PENDING', 'ACTIVE', 'SUSPENDED', 'COMPLETED'] } },
  });
}

export function createEnrollment(data: Prisma.EnrollmentCreateInput, tx?: TransactionClient) {
  return db(tx).enrollment.create({ data, include: enrollmentInclude });
}

export function updateEnrollment(id: string, data: Prisma.EnrollmentUpdateInput, tx?: TransactionClient) {
  return db(tx).enrollment.update({ where: { id }, data, include: enrollmentInclude });
}

/**
 * Atomically transitions an enrollment to COMPLETED ONLY IF its stored
 * status is still `fromStatus` at the moment of the write — an
 * `updateMany` scoped by BOTH `id` and `status` (rather than a plain
 * `update` by id alone) so that two concurrent recompute calls racing
 * against the same enrollment can never both "win": whichever
 * transaction's `updateMany` actually matches a row (returns `count: 1`)
 * is the one allowed to record the `lms.enrollment.completed` audit
 * event — the other sees `count: 0` and does nothing further. This is
 * the correction pass's fix for "course completion event emitted only
 * once" under concurrency (see docs/lms/COMPLETION_ENGINE.md).
 */
export async function completeEnrollmentIfStatus(
  id: string,
  fromStatus: string,
  completedAt: Date,
  actorId: string,
  tx: TransactionClient,
): Promise<boolean> {
  const result = await tx.enrollment.updateMany({
    where: { id, status: fromStatus as never },
    data: { status: 'COMPLETED', completedAt, updatedBy: actorId },
  });
  return result.count === 1;
}
