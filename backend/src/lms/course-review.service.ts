import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getPrismaClient } from '../database/prisma-client';
import { findCourseById, updateCourse } from './course.repository';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { computeCourseProgress } from './progress.service';
import {
  findReviewByCourseAndUser,
  findReviewById,
  createReview as createReviewRow,
  updateReview as updateReviewRow,
  findVisibleReviewsForCourse,
  findAllReviewsForCourseAdmin,
  aggregateVisibleRatings,
} from './course-review.repository';
import { toPublicCourseReview, toMyCourseReview, toAdminCourseReview } from './course-review.serializers';
import type { AdminCourseReview, MyCourseReview, PublicCourseReview, ReviewEligibility } from './course-review.types';
import type { TransactionClient } from '../database/transaction';

/**
 * FR-087 "minimum progress threshold" — this codebase has no per-course
 * configurable review-eligibility field, so a single documented global
 * default is used (the same "instructor-configurable value, or else a
 * documented default" resolution pattern `LessonCompletionRuleType.
 * MINIMUM_WATCH_PERCENT`'s 80% default already established for FR-041).
 * A learner who has fully completed the course is always eligible
 * regardless of this threshold.
 */
export const REVIEW_MIN_PROGRESS_PERCENT = 50;

export async function evaluateReviewEligibility(userId: string, courseId: string): Promise<ReviewEligibility> {
  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  if (!enrollment) return { eligible: false, reason: 'You must be enrolled in this course to leave a review.' };
  if (enrollment.status === 'COMPLETED') return { eligible: true };

  const progress = await computeCourseProgress(enrollment.id, courseId);
  if (progress.percentage >= REVIEW_MIN_PROGRESS_PERCENT) return { eligible: true };

  return {
    eligible: false,
    reason: `Complete at least ${REVIEW_MIN_PROGRESS_PERCENT}% of this course before leaving a review (currently ${progress.percentage}%).`,
  };
}

async function recomputeCourseRating(courseId: string, tx: TransactionClient): Promise<void> {
  const { average, count } = await aggregateVisibleRatings(courseId, tx);
  await updateCourse(courseId, { ratingAverage: average, ratingCount: count }, tx);
}

export interface SubmitReviewInput {
  rating: number;
  title?: string;
  comment?: string;
  outcome?: string;
  wouldRecommend: boolean;
  isAnonymous: boolean;
}

/**
 * FR-087 "MUST allow only one active review per user per course" — enforced
 * as an upsert (a learner revising their opinion updates the same row)
 * rather than rejecting a second submission outright; the `@@unique`
 * constraint is the structural backstop either way.
 */
export async function submitOrUpdateReview(userId: string, courseId: string, input: SubmitReviewInput): Promise<MyCourseReview> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const eligibility = await evaluateReviewEligibility(userId, courseId);
  if (!eligibility.eligible) throw AppError.badRequest(eligibility.reason ?? 'You are not eligible to review this course yet.');

  const review = await withTransaction(async (tx) => {
    const existing = await findReviewByCourseAndUser(courseId, userId, tx);
    const data = {
      rating: input.rating,
      title: input.title ?? null,
      comment: input.comment ?? null,
      outcome: input.outcome ?? null,
      wouldRecommend: input.wouldRecommend,
      isAnonymous: input.isAnonymous,
      // A learner editing their review after a prior HIDE is reinstated to
      // VISIBLE — moderation is meant to act on the CONTENT actually
      // submitted, not to permanently silence the reviewer's account.
      status: 'VISIBLE' as const,
    };

    const saved = existing
      ? await updateReviewRow(existing.id, data, tx)
      : await createReviewRow({ course: { connect: { id: courseId } }, user: { connect: { id: userId } }, ...data }, tx);

    await recomputeCourseRating(courseId, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId: userId,
        action: existing ? 'lms.course_review.updated' : 'lms.course_review.created',
        resourceType: 'course_review',
        resourceId: saved.id,
        afterState: { courseId, rating: input.rating },
      },
      tx,
    );

    return saved;
  });

  return toMyCourseReview(review);
}

export async function listPublicReviews(courseId: string): Promise<PublicCourseReview[]> {
  const rows = await findVisibleReviewsForCourse(courseId);
  return rows.map(toPublicCourseReview);
}

export async function getMyReview(userId: string, courseId: string): Promise<MyCourseReview | null> {
  const row = await findReviewByCourseAndUser(courseId, userId);
  return row ? toMyCourseReview(row) : null;
}

export async function listReviewsForCourseAdmin(courseId: string): Promise<AdminCourseReview[]> {
  const rows = await findAllReviewsForCourseAdmin(courseId);
  return rows.map(toAdminCourseReview);
}

/**
 * FR-087 — moderation is admin-only (route-level `requirePermission`, see
 * lms.routes.ts) and NEVER a delete: `HIDE` flips status so the review
 * (and its audit trail) is preserved but excluded from the public list and
 * the rating aggregate; `RESTORE` reverses it. An instructor holding only
 * course-authoring permissions has no path to this endpoint at all.
 */
export async function moderateReview(reviewId: string, action: 'HIDE' | 'RESTORE', reason: string | undefined, actorId: string): Promise<AdminCourseReview> {
  const existing = await findReviewById(reviewId);
  if (!existing) throw AppError.notFound('Review not found');

  const review = await withTransaction(async (tx) => {
    const updated = await updateReviewRow(
      reviewId,
      action === 'HIDE'
        ? { status: 'HIDDEN', hiddenBy: actorId, hiddenAt: new Date(), hiddenReason: reason ?? null }
        : { status: 'VISIBLE', hiddenBy: null, hiddenAt: null, hiddenReason: null },
      tx,
    );

    await recomputeCourseRating(existing.courseId, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: action === 'HIDE' ? 'lms.course_review.hidden' : 'lms.course_review.restored',
        resourceType: 'course_review',
        resourceId: reviewId,
        reason,
        beforeState: { status: existing.status },
        afterState: { status: updated.status },
      },
      tx,
    );

    return updated;
  });

  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');
  const withUser = await prisma.courseReview.findUnique({ where: { id: review.id }, include: { user: { include: { profile: true } } } });
  if (!withUser) throw AppError.internal('Review could not be reloaded');
  return toAdminCourseReview(withUser);
}
