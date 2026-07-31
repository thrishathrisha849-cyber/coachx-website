import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';
import { ACADEMIC_INTEGRITY_CASE_TYPES } from './academic-integrity.types';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

/**
 * Resolves the {userId, courseId} a flagged target belongs to, by walking
 * the SAME `enrollmentId` every Submission/QuizAttempt already carries
 * (Certificate carries `courseId` directly) — no new denormalized field
 * needed. Returns `courseId: null` for a bare USER target (identity
 * fraud has no single course of origin — it blocks EVERY course's
 * certificate eligibility for that learner, not just one).
 */
export async function resolveAcademicIntegrityTarget(
  targetType: 'SUBMISSION' | 'QUIZ_ATTEMPT' | 'CERTIFICATE' | 'USER',
  targetId: string,
  tx?: TransactionClient,
): Promise<{ userId: string; courseId: string | null }> {
  const client = db(tx);

  if (targetType === 'USER') {
    const user = await client.user.findUnique({ where: { id: targetId } });
    if (!user) throw AppError.notFound('User not found');
    return { userId: user.id, courseId: null };
  }

  if (targetType === 'SUBMISSION') {
    const submission = await client.submission.findUnique({ where: { id: targetId } });
    if (!submission) throw AppError.notFound('Submission not found');
    const enrollment = await client.enrollment.findUnique({ where: { id: submission.enrollmentId } });
    if (!enrollment) throw AppError.notFound('Enrollment not found');
    return { userId: enrollment.userId, courseId: enrollment.courseId };
  }

  if (targetType === 'QUIZ_ATTEMPT') {
    const attempt = await client.quizAttempt.findUnique({ where: { id: targetId } });
    if (!attempt) throw AppError.notFound('Quiz attempt not found');
    const enrollment = await client.enrollment.findUnique({ where: { id: attempt.enrollmentId } });
    if (!enrollment) throw AppError.notFound('Enrollment not found');
    return { userId: enrollment.userId, courseId: enrollment.courseId };
  }

  // CERTIFICATE
  const certificate = await client.certificate.findUnique({ where: { id: targetId } });
  if (!certificate) throw AppError.notFound('Certificate not found');
  const enrollment = await client.enrollment.findUnique({ where: { id: certificate.enrollmentId } });
  if (!enrollment) throw AppError.notFound('Enrollment not found');
  return { userId: enrollment.userId, courseId: certificate.courseId };
}

/** Every OPEN/UNDER_REVIEW/ACTION_TAKEN academic-integrity case against this user, with its appeals (most recent first) so a caller can check for a successful OVERTURNED appeal. */
export function findActiveAcademicIntegrityCasesForUser(userId: string, tx?: TransactionClient) {
  return db(tx).trustSafetyCase.findMany({
    where: {
      reportedUserId: userId,
      type: { in: [...ACADEMIC_INTEGRITY_CASE_TYPES] },
      status: { in: ['OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN'] },
    },
    include: { appeals: { orderBy: { createdAt: 'desc' } } },
  });
}

/** Every academic-integrity case (any status) against this user, own-cases-only, newest first — the learner's "my cases" list, so they can actually discover a flag and its `caseId` to appeal. */
export function findAcademicIntegrityCasesForUser(userId: string, tx?: TransactionClient) {
  return db(tx).trustSafetyCase.findMany({
    where: { reportedUserId: userId, type: { in: [...ACADEMIC_INTEGRITY_CASE_TYPES] } },
    orderBy: { createdAt: 'desc' },
    include: { appeals: { orderBy: { createdAt: 'desc' } } },
  });
}

/** Admin case queue, scoped to ONLY the academic-integrity types (never mixes in community REPORT/BLOCK/MUTE cases). */
export function findAcademicIntegrityCasesAdmin(
  filter: { status?: string },
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  const where = {
    type: { in: [...ACADEMIC_INTEGRITY_CASE_TYPES] },
    ...(filter.status ? { status: filter.status as never } : {}),
  };
  return Promise.all([
    db(tx).trustSafetyCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      include: { appeals: { orderBy: { createdAt: 'desc' } } },
    }),
    db(tx).trustSafetyCase.count({ where }),
  ]);
}
