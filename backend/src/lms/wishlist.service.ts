import { AppError } from '../utils/app-error';
import { withTransaction, type TransactionClient } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getEmailAdapter } from '../auth/email.port';
import { logger } from '../utils/logger';
import { findCourseById } from './course.repository';
import { findOpenEnrollment, countSeatOccupyingEnrollments } from './enrollment.repository';
import { countActiveOffersExcludingUser } from './waitlist.repository';
import { SELF_ENROLL_ALLOWED_STATUSES } from './enrollment.service';
import type { LmsBusinessRuleCode } from './lms-error-codes';
import {
  findWishlistEntry,
  createWishlistEntry,
  deleteWishlistEntry,
  findMyWishlist,
  findWishlistEntriesForCourse,
  markEnrollmentOpenNotified,
  markPriceDropNotified,
  resetEnrollmentOpenNotifications,
} from './wishlist.repository';
import { toMyWishlistEntry } from './wishlist.serializers';
import type { MyWishlistEntry } from './wishlist.types';

/**
 * 004 Wishlist batch (FR-027). A simple learner-owned save-for-later list
 * for a course that is currently "eligible but locked" — the concrete real
 * signal is `Course.status = ENROLLMENT_PAUSED` (FR-015's own "visible but
 * not accepting new enrollment" state), the ONE real, enforced enrollment
 * lock this codebase has (`enrollmentStartAt`/`enrollmentEndAt` exist on
 * `Course` but are not currently enforced anywhere in
 * `enrollment.service.ts`'s self-enroll flow — a pre-existing gap outside
 * this batch's scope, so a future-dated course is not treated as "locked"
 * here). A COURSE_FULL course is deliberately NOT wishlist-eligible —
 * `waitlist.service.ts` already owns that capacity-gated case with its own
 * priority-queue/reservation machinery; offering two competing "save this
 * for later" mechanisms for the same trigger would be confusing, so a
 * full course's wishlist-join attempt is rejected with a message pointing
 * at the Waitlist instead.
 *
 * "Notify-when-available"/"enrollment-open alert" is a REAL email, fired
 * from the exact real action point FR-027 names — `course.service.ts`'s
 * `changeCourseStatus`, the moment a course transitions OUT of
 * ENROLLMENT_PAUSED into a self-enrollable status — not a scheduled sweep
 * (no background job scheduler exists in this codebase). "Price-drop
 * alert" is likewise a real email fired from `updateExistingCourse`'s
 * actual price-edit action point, the moment the price is set below what
 * a wishlister saved at. Both are best-effort (never block the admin
 * action that triggers them), matching the same discipline
 * `recordAuditEvent`/Waitlist's offer email already established. The
 * `priceDropped`/`enrollmentOpen` fields on `MyWishlistEntry` are ALSO
 * recomputed honestly at read time (so a client always sees current
 * truth even between email-triggering events), the same read-time-
 * evaluation convention Announcements'/Translation's own scheduled-window
 * fields already use.
 */

async function isCourseCurrentlyFull(courseId: string, enrollmentLimit: number | null, userId: string, tx?: TransactionClient): Promise<boolean> {
  if (enrollmentLimit === null) return false;
  const occupied = await countSeatOccupyingEnrollments(courseId, tx);
  const reservedForOthers = await countActiveOffersExcludingUser(courseId, userId, tx);
  return occupied + reservedForOthers >= enrollmentLimit;
}

/** POST /me/courses/:courseId/wishlist — idempotent (a heart-icon-toggle UX, not a strict once-only queue slot like Waitlist's). */
export async function saveToWishlist(userId: string, courseId: string): Promise<MyWishlistEntry> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const existingOpen = await findOpenEnrollment(userId, courseId);
  if (existingOpen) throw AppError.conflict('You are already enrolled in this course');

  // FR-027's "eligible-but-locked" is scoped to the one real, ENFORCED lock
  // in this codebase: `ENROLLMENT_PAUSED` (FR-015's own "visible but not
  // accepting new enrollment" status — see `enrollment.service.ts`'s
  // `NO_NEW_ENROLLMENT_STATUSES`). `enrollmentStartAt`/`enrollmentEndAt`
  // exist on `Course` but are NOT currently enforced anywhere in
  // `enrollment.service.ts`'s self-enroll flow (a pre-existing gap outside
  // this batch's scope) — a course with a future `enrollmentStartAt` can
  // already be self-enrolled today, so it is not a real "lock" to wishlist
  // against. A DRAFT/SUBMITTED_FOR_REVIEW/CHANGES_REQUESTED/APPROVED/
  // ARCHIVED/RETIRED course isn't reachable at all for a non-admin
  // learner. A COURSE_FULL course is deliberately excluded here — see this
  // file's own doc comment — the learner is pointed at Waitlist instead.
  if (course.status !== 'ENROLLMENT_PAUSED') {
    if (SELF_ENROLL_ALLOWED_STATUSES.has(course.status)) {
      const full = await isCourseCurrentlyFull(courseId, course.enrollmentLimit, userId);
      if (full) {
        const code: LmsBusinessRuleCode = 'COURSE_FULL';
        throw AppError.badRequest('This course is full — join the waitlist instead of the wishlist', { code });
      }
      throw AppError.badRequest('This course is open for enrollment — enroll directly instead of saving it for later');
    }
    throw AppError.badRequest('This course is not currently available to save');
  }

  const entry = await withTransaction(async (tx) => {
    const existing = await findWishlistEntry(userId, courseId, tx);
    if (existing) return existing;

    const created = await createWishlistEntry(
      { userId, courseId, priceAtSaveAmountMinor: course.priceAmountMinor, priceAtSaveCurrency: course.currency },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.wishlist.saved', resourceType: 'wishlist_entry', resourceId: created.id, metadata: { courseId } },
      tx,
    );

    return created;
  });

  return toMyWishlistEntry({
    id: entry.id,
    courseId: entry.courseId,
    priceAtSaveAmountMinor: entry.priceAtSaveAmountMinor,
    priceAtSaveCurrency: entry.priceAtSaveCurrency,
    savedAt: entry.savedAt,
    course: {
      title: course.title,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
      priceAmountMinor: course.priceAmountMinor,
      status: course.status,
      priceType: course.priceType,
      certificateAvailable: course.certificateAvailable,
    },
  });
}

/** DELETE /me/courses/:courseId/wishlist — idempotent (removing a non-existent entry is a no-op success). */
export async function removeFromWishlist(userId: string, courseId: string): Promise<void> {
  await withTransaction(async (tx) => {
    await deleteWishlistEntry(userId, courseId, tx);
    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.wishlist.removed', resourceType: 'wishlist_entry', resourceId: courseId, metadata: { courseId } },
      tx,
    );
  });
}

/** GET /me/wishlist — the learner's own saved-for-later list (FR-027's "dashboard saved section"; also wired into `catalog.service.ts`'s FR-090 wishlist section). */
export async function listMyWishlist(userId: string): Promise<MyWishlistEntry[]> {
  const rows = await findMyWishlist(userId);
  return rows.map((r) => toMyWishlistEntry(r as never));
}

/**
 * Real hook called from `course.service.ts`'s `changeCourseStatus` the
 * moment a course transitions OUT of ENROLLMENT_PAUSED into a
 * self-enrollable status. Best-effort — never blocks the status-change
 * transaction (same discipline every other LMS email hook this codebase
 * already established uses).
 */
export async function notifyWishlistersOfEnrollmentOpen(courseId: string, courseTitle: string): Promise<void> {
  try {
    const entries = await findWishlistEntriesForCourse(courseId);
    const pending = entries.filter((e) => !e.enrollmentOpenNotifiedAt);
    for (const entry of pending) {
      await getEmailAdapter().send({
        to: entry.user.email,
        subject: `Enrollment is now open: ${courseTitle}`,
        text: `Good news — "${courseTitle}" is now open for enrollment. You saved this course to your wishlist; enroll now before it fills up.`,
      });
      await markEnrollmentOpenNotified(entry.id);
    }
  } catch (err) {
    logger.warn('Wishlist enrollment-open email delivery failed', { courseId, error: err instanceof Error ? err.message : err });
  }
}

/** Real hook called from `course.service.ts`'s `changeCourseStatus` when a course re-enters ENROLLMENT_PAUSED, so a future re-open notifies again. Safe to run inside the same transaction (a plain flag reset, not an email). */
export async function resetWishlistEnrollmentOpenFlags(courseId: string, tx?: TransactionClient): Promise<void> {
  await resetEnrollmentOpenNotifications(courseId, tx);
}

/**
 * Real hook called from `course.service.ts`'s `updateExistingCourse` the
 * moment an admin sets a course's price below what a wishlister saved at.
 * Best-effort — never blocks the course-edit transaction.
 */
export async function notifyWishlistersOfPriceDrop(courseId: string, courseTitle: string, newPriceAmountMinor: number): Promise<void> {
  try {
    const entries = await findWishlistEntriesForCourse(courseId);
    const affected = entries.filter((e) => e.priceAtSaveAmountMinor > newPriceAmountMinor && !e.priceDropNotifiedAt);
    for (const entry of affected) {
      await getEmailAdapter().send({
        to: entry.user.email,
        subject: `Price drop: ${courseTitle}`,
        text: `Good news — the price of "${courseTitle}" (saved to your wishlist) has dropped. Check it out before the price changes again.`,
      });
      await markPriceDropNotified(entry.id);
    }
  } catch (err) {
    logger.warn('Wishlist price-drop email delivery failed', { courseId, error: err instanceof Error ? err.message : err });
  }
}
