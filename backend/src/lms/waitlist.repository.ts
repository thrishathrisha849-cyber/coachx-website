import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

const ACTIVE_STATUSES = ['WAITING', 'OFFERED'] as const;

/** Monotonic per-course join-order counter — never reused, even across terminal-state entries (see model doc comment). */
export async function nextPriorityForCourse(courseId: string, tx?: TransactionClient): Promise<number> {
  const result = await db(tx).waitlistEntry.aggregate({ where: { courseId }, _max: { priority: true } });
  return (result._max.priority ?? 0) + 1;
}

export function findWaitlistEntryById(id: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.findUnique({ where: { id } });
}

/** The user's own most recent entry for this course (any status) — the "my waitlist status" read. */
export function findLatestEntryForUserCourse(userId: string, courseId: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.findFirst({ where: { userId, courseId }, orderBy: { joinedAt: 'desc' } });
}

export function createWaitlistEntry(
  data: { userId: string; courseId: string; priority: number; referralSource: string | null },
  tx?: TransactionClient,
) {
  return db(tx).waitlistEntry.create({ data });
}

/** Every currently-live (unexpired) OFFERED reservation for a course — used to answer "is the freed seat already spoken for?" */
export function findActiveOffer(courseId: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.findFirst({ where: { courseId, status: 'OFFERED', offerExpiresAt: { gt: new Date() } } });
}

/** Sweep — flips every stale (past-window) OFFERED entry for a course to EXPIRED. Read-time pass-through, no scheduler needed. */
export function expireStaleOffers(courseId: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.updateMany({
    where: { courseId, status: 'OFFERED', offerExpiresAt: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  });
}

export function findNextWaiting(courseId: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.findFirst({ where: { courseId, status: 'WAITING' }, orderBy: { priority: 'asc' } });
}

export function offerSeatToEntry(id: string, offerExpiresAt: Date, tx?: TransactionClient) {
  return db(tx).waitlistEntry.update({ where: { id }, data: { status: 'OFFERED', offeredAt: new Date(), offerExpiresAt } });
}

export function markOfferEmailSent(id: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.update({ where: { id }, data: { offerEmailSentAt: new Date() } });
}

export function claimEntry(id: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.update({ where: { id }, data: { status: 'CLAIMED', claimedAt: new Date() } });
}

/** Every currently-live (unexpired) OFFERED reservation for a course, EXCLUDING one specific user's own — the "reserved for others" count `enrollment.service.ts`'s capacity check needs so a real reservation actually holds the seat. */
export async function countActiveOffersExcludingUser(courseId: string, excludeUserId: string, tx?: TransactionClient): Promise<number> {
  return db(tx).waitlistEntry.count({
    where: { courseId, status: 'OFFERED', offerExpiresAt: { gt: new Date() }, userId: { not: excludeUserId } },
  });
}

export function findWaitlistForCourseAdmin(courseId: string, tx?: TransactionClient) {
  return db(tx).waitlistEntry.findMany({
    where: { courseId, status: { in: ACTIVE_STATUSES as never } },
    orderBy: { priority: 'asc' },
    include: { user: { include: { profile: true } } },
  });
}
