import { AppError } from '../utils/app-error';

/**
 * Centralized Course status state machine (Phase 6 Part 1 brief's
 * "Define valid transitions centrally") — same shape/pattern as the CMS
 * `Page` model's `VALID_TRANSITIONS` map in `backend/src/cms/page.service.ts`.
 * The ONLY place course-status transition legality is decided.
 *
 * CORRECTION (spec-alignment pass): this state machine and its states were
 * rebuilt directly from 004/spec.md FR-015 and FR-100 — see
 * docs/lms/COURSE_LIFECYCLE.md for the full reconciliation of FR-015's 12
 * editorial statuses against FR-100's 6-state review workflow. The
 * previous version of this file used a generic prompt-supplied state list
 * (`REVIEW`/`UNPUBLISHED`) with no basis in either FR.
 */
export const COURSE_VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED_FOR_REVIEW'],
  SUBMITTED_FOR_REVIEW: ['CHANGES_REQUESTED', 'APPROVED'],
  CHANGES_REQUESTED: ['SUBMITTED_FOR_REVIEW', 'DRAFT'],
  APPROVED: ['SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED'],
  PUBLISHED: ['UNLISTED', 'ENROLLMENT_PAUSED', 'ARCHIVED'],
  UNLISTED: ['PUBLISHED', 'ARCHIVED'],
  ENROLLMENT_PAUSED: ['PUBLISHED', 'ARCHIVED'],
  // FR-015: "Archived preserves existing learner progress while blocking
  // new enrollment" — implies a course CAN be revived (product would not
  // otherwise preserve progress for nothing); ARCHIVED -> DRAFT lets an
  // admin fully re-author and re-run it through the review workflow.
  ARCHIVED: ['DRAFT', 'RETIRED'],
  // FR-015: "Retired marks the course replaced or permanently unavailable"
  // — a true terminal state, deliberately no transitions out.
  RETIRED: [],
};

export function assertValidCourseTransition(from: string, to: string): void {
  const allowed = COURSE_VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw AppError.badRequest(`Cannot transition course from ${from} to ${to}`);
  }
}

export interface PublishableCourseFields {
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categoryId: string | null;
  thumbnailUrl: string | null;
  publishAt: Date | null;
  expireAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/**
 * Publish-readiness validation (004 FR-097's course-builder "review and
 * publish" step; FR-100's Approved state implies "ready to go live").
 * CORRECTION: now invoked at the `SUBMITTED_FOR_REVIEW -> APPROVED`
 * transition (moving INTO Approved is the point FR-100's workflow defines
 * as "ready"), not at the publish/schedule transition as in the prior,
 * generic-prompt-driven version — `APPROVED -> SCHEDULED/PUBLISHED` no
 * longer re-checks readiness, since Approved already guarantees it.
 *
 * seoTitle/seoDescription are NOT required — Course.title/shortDescription
 * are an acceptable generated fallback (same "fallback, not hard failure"
 * approach as documented in docs/public-site/SEO.md for CMS pages without
 * explicit SEO overrides).
 */
export function assertPublishReady(course: PublishableCourseFields): void {
  const missing: string[] = [];

  if (!course.title?.trim()) missing.push('title');
  if (!course.slug?.trim()) missing.push('slug');
  if (!course.shortDescription?.trim()) missing.push('shortDescription');
  if (!course.description?.trim()) missing.push('description');
  if (!course.categoryId) missing.push('category');
  if (!course.thumbnailUrl?.trim()) missing.push('thumbnailUrl');

  if (missing.length > 0) {
    throw AppError.badRequest('Course is missing required fields to be approved for publishing', { missing });
  }

  if (course.publishAt && course.expireAt && course.publishAt >= course.expireAt) {
    throw AppError.badRequest('publishAt must be before expireAt');
  }
}

/**
 * At-least-one-module publish gate. A course with zero modules has nothing
 * for a learner to do — deliberately enforced (brief: "If module presence
 * is required for publishing, implement and test it"). Lessons are NOT
 * required (Part 2 owns Lesson) — an empty-but-present module is enough at
 * this phase. Checked at the same `SUBMITTED_FOR_REVIEW -> APPROVED`
 * transition as `assertPublishReady`.
 */
export function assertHasPublishableModule(moduleCount: number): void {
  if (moduleCount < 1) {
    throw AppError.badRequest('A course must have at least one module before it can be approved for publishing');
  }
}

/**
 * Read-time publish/expiry-window visibility check — same pattern Page
 * and Announcement already use, no scheduled worker. `SCHEDULED` courses
 * become visible automatically once `publishAt` arrives (004 US7 AC4:
 * "the course automatically becomes visible to eligible learners without
 * manual intervention") WITHOUT the `status` column itself flipping to
 * `PUBLISHED` — the status remaining `SCHEDULED` past its `publishAt` date
 * is accepted, documented staleness in the admin view (no background
 * worker exists anywhere in this codebase), not a visibility bug — public
 * visibility is correct in all cases regardless of the cosmetic status
 * label. `ENROLLMENT_PAUSED` remains publicly visible (informational,
 * simply not accepting new enrollment — no Enrollment model exists yet to
 * actually enforce that boundary).
 */
export function isCoursePubliclyVisible(course: {
  status: string;
  publishAt: Date | null;
  expireAt: Date | null;
}): boolean {
  if (!['PUBLISHED', 'SCHEDULED', 'ENROLLMENT_PAUSED'].includes(course.status)) return false;

  const now = new Date();
  if (course.publishAt && course.publishAt > now) return false;
  if (course.expireAt && course.expireAt <= now) return false;

  return true;
}

/**
 * Same as `isCoursePubliclyVisible` but additionally allows `UNLISTED`
 * (FR-015: "accessible only via direct link..." — never returned by a
 * listing/search query, but a valid detail-by-slug lookup). Used ONLY by
 * the single-course detail read path, never by any listing/search path.
 */
export function isCourseVisibleByDirectLink(course: {
  status: string;
  publishAt: Date | null;
  expireAt: Date | null;
}): boolean {
  if (course.status === 'UNLISTED') {
    const now = new Date();
    if (course.publishAt && course.publishAt > now) return false;
    if (course.expireAt && course.expireAt <= now) return false;
    return true;
  }
  return isCoursePubliclyVisible(course);
}
