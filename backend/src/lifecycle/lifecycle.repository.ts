import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findLifecycleState(userId: string, tx?: TransactionClient) {
  return db(tx).userLifecycleState.findUnique({ where: { userId } });
}

/** Called once at registration (mirrors the Credential/UserProfile creation pattern in registration.service.ts). */
export function createLifecycleState(userId: string, tx?: TransactionClient) {
  return db(tx).userLifecycleState.create({ data: { userId } });
}

export function updateLifecycleState(userId: string, data: Prisma.UserLifecycleStateUpdateInput, tx?: TransactionClient) {
  return db(tx).userLifecycleState.update({ where: { userId }, data });
}

/** FR-042 Activated Member criterion: has the user started at least one enrollment (a learning path)? */
export function hasAnyEnrollment(userId: string, tx?: TransactionClient) {
  return db(tx).enrollment.count({ where: { userId } }).then((count) => count > 0);
}

/** FR-042 Activated Member criterion: has the user completed at least one lesson? */
export function hasCompletedAnyLesson(userId: string, tx?: TransactionClient) {
  return db(tx)
    .lessonProgress.count({ where: { enrollment: { userId }, status: 'COMPLETED' } })
    .then((count) => count > 0);
}

/** FR-044 Paying Member transition: has the user completed at least one purchase (Part 1 has no Order/Subscription table yet — a completed Enrollment via a PAID-priced course is the closest verifiable Part-1 signal alongside `firstPurchaseAt`, which future billing/checkout work sets directly). */
export function hasAnyPaidEnrollment(userId: string, tx?: TransactionClient) {
  return db(tx)
    .enrollment.count({ where: { userId, course: { priceType: 'PAID' } } })
    .then((count) => count > 0);
}

export function createLifecycleEvent(
  userId: string,
  type: Prisma.LifecycleEventCreateInput['type'],
  metadata: Prisma.InputJsonValue | undefined,
  tx?: TransactionClient,
) {
  return db(tx).lifecycleEvent.create({ data: { userId, type, metadata } });
}

export function countRecentEvents(
  userId: string,
  types: Prisma.LifecycleEventCreateInput['type'][],
  since: Date,
  tx?: TransactionClient,
) {
  return db(tx).lifecycleEvent.count({ where: { userId, type: { in: types }, occurredAt: { gte: since } } });
}

// --- Business Milestones (FR-045) ---------------------------------------

export function findMilestone(userId: string, type: string, tx?: TransactionClient) {
  return db(tx).businessMilestone.findUnique({ where: { userId_type: { userId, type: type as never } } });
}

export function claimMilestone(userId: string, type: string, evidence: Prisma.InputJsonValue | undefined, tx?: TransactionClient) {
  return db(tx).businessMilestone.create({ data: { userId, type: type as never, evidence } });
}

export function findMilestoneById(id: string, tx?: TransactionClient) {
  return db(tx).businessMilestone.findUnique({ where: { id } });
}

export function listMilestonesForReview(
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  return Promise.all([
    db(tx).businessMilestone.findMany({
      where: { status: 'CLAIMED' },
      orderBy: { claimedAt: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db(tx).businessMilestone.count({ where: { status: 'CLAIMED' } }),
  ]);
}

export function verifyMilestone(id: string, verifiedBy: string, tx?: TransactionClient) {
  return db(tx).businessMilestone.update({
    where: { id },
    data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy },
  });
}

export function rejectMilestone(id: string, verifiedBy: string, reason: string, tx?: TransactionClient) {
  return db(tx).businessMilestone.update({
    where: { id },
    data: { status: 'REJECTED', verifiedBy, rejectedReason: reason },
  });
}

export function hasAnyVerifiedMilestone(userId: string, tx?: TransactionClient) {
  return db(tx)
    .businessMilestone.count({ where: { userId, status: 'VERIFIED' } })
    .then((count) => count > 0);
}

/** 003 FR-107/FR-108: a member's own milestones (any status) for the dashboard Progress widget — distinct from `listMilestonesForReview`, which is admin-facing and CLAIMED-only. */
export function listMilestonesForUser(userId: string, tx?: TransactionClient) {
  return db(tx).businessMilestone.findMany({ where: { userId }, orderBy: { claimedAt: 'desc' } });
}
