import { AppError } from '../utils/app-error';

/**
 * Centralized Course status state machine (Phase 6 Part 1 brief's
 * "Define valid transitions centrally") — same shape/pattern as the CMS
 * `Page` model's `VALID_TRANSITIONS` map in `backend/src/cms/page.service.ts`.
 * The ONLY place course-status transition legality is decided.
 */
export const COURSE_VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'APPROVED', 'ARCHIVED'],
  APPROVED: ['SCHEDULED', 'PUBLISHED', 'DRAFT', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED', 'ARCHIVED'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
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
  visibility: string;
  publishAt: Date | null;
  expireAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/**
 * Publish-readiness validation (Phase 6 Part 1 brief's "Course Publishing
 * Requirements"). Runs whenever a course transitions INTO PUBLISHED or
 * SCHEDULED (scheduling is "will become published," so it must meet the
 * same bar). Deliberately does NOT require at least one module here — see
 * `assertHasPublishableModule` below, kept separate because it needs a
 * database read the pure-field checks here don't.
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
    throw AppError.badRequest('Course is missing required fields for publishing', { missing });
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
 * this phase.
 */
export function assertHasPublishableModule(moduleCount: number): void {
  if (moduleCount < 1) {
    throw AppError.badRequest('A course must have at least one module before it can be published');
  }
}

/** Read-time publish/expiry-window visibility check — same pattern Page and Announcement already use, no scheduled worker. */
export function isCoursePubliclyVisible(course: {
  status: string;
  visibility: string;
  publishAt: Date | null;
  expireAt: Date | null;
}): boolean {
  if (course.status !== 'PUBLISHED') return false;
  if (course.visibility !== 'PUBLIC' && course.visibility !== 'UNLISTED') return false;

  const now = new Date();
  if (course.publishAt && course.publishAt > now) return false;
  if (course.expireAt && course.expireAt <= now) return false;

  return true;
}
