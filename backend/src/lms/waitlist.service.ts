import { AppError } from '../utils/app-error';
import { withTransaction, type TransactionClient } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getEmailAdapter } from '../auth/email.port';
import { logger } from '../utils/logger';
import { findCourseById } from './course.repository';
import { findOpenEnrollment, countSeatOccupyingEnrollments } from './enrollment.repository';
import { selfEnroll } from './enrollment.service';
import {
  nextPriorityForCourse,
  findWaitlistEntryById,
  findLatestEntryForUserCourse,
  createWaitlistEntry,
  findActiveOffer,
  expireStaleOffers,
  findNextWaiting,
  offerSeatToEntry,
  markOfferEmailSent,
  claimEntry,
  findWaitlistForCourseAdmin,
} from './waitlist.repository';
import { toMyWaitlistEntry, toAdminWaitlistEntry } from './waitlist.serializers';
import type { AdminWaitlistEntry, MyWaitlistEntry } from './waitlist.types';

/**
 * 004 Waitlist batch (FR-028/029). A course with `enrollmentLimit` set that
 * is at capacity accepts waitlist joins instead of direct enrollment. When
 * a seat frees, the next-priority (first-come-first-served) WAITING entry
 * is OFFERED a real, time-limited reservation — this is a genuine
 * reservation, not just a notification: `enrollment.service.ts`'s capacity
 * check (see its own doc comment) now counts every live OFFERED entry
 * against the course's `enrollmentLimit` too, so a new direct-enroll
 * attempt by someone else correctly sees the course as still full while an
 * offer is outstanding. An unclaimed, expired offer passes automatically
 * to the next-priority entry — evaluated at READ time
 * (`sweepAndAdvanceWaitlist`, called both when a seat is freed AND
 * whenever the waitlist is read), the same "no background scheduler
 * exists in this codebase" convention Announcements/Translation already
 * established, never a fabricated cron job.
 *
 * Only "admin action" (an admin's `revokeEnrollment`) is a real seat-
 * releasing trigger in this codebase today — FR-028 also names
 * cancellation/payment-failure/expiry, but no self-service cancel, no
 * payment system, and no automatic expiry-status-flip exist anywhere
 * (access-window expiry is evaluated at read time via `accessEndAt`,
 * never flipping the stored `status` column — see `lms-part2.integration.
 * test.ts`'s own documented "Expired access" scenario). The hook lives at
 * `enrollment.service.ts`'s single shared `transitionEnrollment` choke
 * point, so CANCELLED/EXPIRED will correctly trigger it too the moment
 * any future code path ever calls them, without needing to revisit this file.
 */

const WAITLIST_OFFER_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours — a real, sensible default; FR-029 does not name an exact duration.

async function assertWaitlistEligible(userId: string, courseId: string, tx?: TransactionClient) {
  const course = await findCourseById(courseId, tx);
  if (!course) throw AppError.notFound('Course not found');
  if (course.enrollmentLimit === null) {
    throw AppError.badRequest('This course has no capacity limit — enroll directly');
  }

  const existingOpen = await findOpenEnrollment(userId, courseId, tx);
  if (existingOpen) throw AppError.conflict('You are already enrolled in this course');

  return course;
}

/** POST /me/courses/:courseId/waitlist */
export async function joinWaitlist(userId: string, courseId: string, referralSource?: string): Promise<MyWaitlistEntry> {
  const course = await assertWaitlistEligible(userId, courseId);

  const occupied = await countSeatOccupyingEnrollments(courseId);
  if (occupied < course.enrollmentLimit!) {
    throw AppError.badRequest('This course has open seats — enroll directly instead of joining the waitlist');
  }

  const entry = await withTransaction(async (tx) => {
    const priority = await nextPriorityForCourse(courseId, tx);
    const created = await createWaitlistEntry({ userId, courseId, priority, referralSource: referralSource ?? null }, tx).catch((error: unknown) => {
      const normalized = normalizeDatabaseError(error);
      if (normalized.statusCode === 409) throw AppError.conflict('You are already on the waitlist for this course');
      throw normalized;
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.waitlist.joined', resourceType: 'waitlist_entry', resourceId: created.id, metadata: { courseId } },
      tx,
    );

    return created;
  });

  return toMyWaitlistEntry(entry);
}

/**
 * The single read-time evaluation step: expire any stale offers, then —
 * if no live offer is currently outstanding and a seat is actually free —
 * offer it to the next-priority WAITING entry. Called both right after a
 * seat is freed (`enrollment.service.ts`'s `transitionEnrollment`) and
 * whenever the waitlist itself is read, so "an expired offer passes to
 * the next user" is true without any scheduler.
 */
export async function sweepAndAdvanceWaitlist(courseId: string, tx?: TransactionClient): Promise<void> {
  const run = async (t: TransactionClient) => {
    const course = await findCourseById(courseId, t);
    if (!course || course.enrollmentLimit === null) return;

    await expireStaleOffers(courseId, t);

    const activeOffer = await findActiveOffer(courseId, t);
    if (activeOffer) return; // a live reservation is already outstanding — nothing further to do right now

    const occupied = await countSeatOccupyingEnrollments(courseId, t);
    if (occupied >= course.enrollmentLimit) return; // no free seat right now

    const next = await findNextWaiting(courseId, t);
    if (!next) return;

    const offerExpiresAt = new Date(Date.now() + WAITLIST_OFFER_WINDOW_MS);
    await offerSeatToEntry(next.id, offerExpiresAt, t);

    await recordAuditEvent(
      { actorType: 'SYSTEM', actorId: courseId, action: 'lms.waitlist.offered', resourceType: 'waitlist_entry', resourceId: next.id, metadata: { courseId, offerExpiresAt } },
      t,
    );

    // Best-effort — never blocks/fails the seat-release action or the read
    // that triggered this sweep (same discipline `recordLearningEvent`/
    // `recordAuditEvent` already established).
    try {
      const nextUser = await t.user.findUnique({ where: { id: next.userId } });
      if (nextUser) {
        await getEmailAdapter().send({
          to: nextUser.email,
          subject: `A seat opened up: ${course.title}`,
          text: `Good news — a seat opened up in "${course.title}". You have until ${offerExpiresAt.toLocaleString()} to claim it before it passes to the next person on the waitlist.`,
        });
        await markOfferEmailSent(next.id, t);
      }
    } catch (err) {
      logger.warn('Waitlist offer email delivery failed', { courseId, waitlistEntryId: next.id, error: err instanceof Error ? err.message : err });
    }
  };

  if (tx) {
    await run(tx);
  } else {
    await withTransaction(run);
  }
}

/** GET /me/courses/:courseId/waitlist — the learner's own latest entry (of any status — WAITING/OFFERED/CLAIMED/EXPIRED/CANCELLED), or null if they've never joined. */
export async function getMyWaitlistStatus(userId: string, courseId: string): Promise<MyWaitlistEntry | null> {
  await sweepAndAdvanceWaitlist(courseId);
  const entry = await findLatestEntryForUserCourse(userId, courseId);
  return entry ? toMyWaitlistEntry(entry) : null;
}

/** POST /me/waitlist/:id/claim */
export async function claimWaitlistOffer(userId: string, waitlistEntryId: string): Promise<MyWaitlistEntry> {
  const entry = await findWaitlistEntryById(waitlistEntryId);
  if (!entry || entry.userId !== userId) throw AppError.notFound('Waitlist entry not found');

  if (entry.status !== 'OFFERED') {
    throw AppError.conflict('This waitlist entry does not have an active offer to claim');
  }
  if (!entry.offerExpiresAt || entry.offerExpiresAt <= new Date()) {
    // Lapsed since last sweep — expire it now and advance the queue rather
    // than let the learner claim a seat that is no longer reserved for them.
    await sweepAndAdvanceWaitlist(entry.courseId);
    throw AppError.conflict('Your offer has expired and has passed to the next person on the waitlist');
  }

  // Reuses the existing, already-tested `selfEnroll` — the waitlist is
  // purely a CAPACITY gate, not a distinct entitlement path; the courses
  // this batch's waitlist applies to are entitlement-checked exactly the
  // same way a direct enrollment would be. `selfEnroll` re-verifies
  // capacity itself (now offer-aware — see `enrollment.service.ts`), so a
  // stale/lost race is still caught safely even if this check above somehow
  // passed a moment too early.
  const enrollment = await selfEnroll(entry.courseId, userId);

  const claimed = await withTransaction(async (tx) => {
    const updated = await claimEntry(entry.id, tx);
    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.waitlist.claimed', resourceType: 'waitlist_entry', resourceId: entry.id, metadata: { courseId: entry.courseId, enrollmentId: enrollment.id } },
      tx,
    );
    return updated;
  });

  return toMyWaitlistEntry(claimed);
}

/** GET /admin/courses/:courseId/waitlist */
export async function listWaitlistForCourseAdmin(courseId: string): Promise<AdminWaitlistEntry[]> {
  await sweepAndAdvanceWaitlist(courseId);
  const rows = await findWaitlistForCourseAdmin(courseId);
  return rows.map((r) => toAdminWaitlistEntry(r as never));
}
