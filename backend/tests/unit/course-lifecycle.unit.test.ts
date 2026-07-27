import {
  COURSE_VALID_TRANSITIONS,
  assertValidCourseTransition,
  assertPublishReady,
  assertHasPublishableModule,
  isCoursePubliclyVisible,
  isCourseVisibleByDirectLink,
} from '../../src/lms/course-lifecycle.policy';
import { AppError } from '../../src/utils/app-error';

/**
 * Phase 6 Part 1 CORRECTION (spec-alignment pass): rewritten against the
 * FR-015/FR-100-aligned state machine — see
 * docs/lms/COURSE_LIFECYCLE.md. Previous version tested the generic
 * prompt-supplied `REVIEW`/`UNPUBLISHED` states, which have no basis in
 * 004/spec.md.
 */
describe('course-lifecycle.policy — assertValidCourseTransition()', () => {
  it('allows every transition listed in COURSE_VALID_TRANSITIONS', () => {
    for (const [from, tos] of Object.entries(COURSE_VALID_TRANSITIONS)) {
      for (const to of tos) {
        expect(() => assertValidCourseTransition(from, to)).not.toThrow();
      }
    }
  });

  it('rejects DRAFT -> PUBLISHED (skipping the review workflow)', () => {
    expect(() => assertValidCourseTransition('DRAFT', 'PUBLISHED')).toThrow(AppError);
  });

  it('rejects SUBMITTED_FOR_REVIEW -> PUBLISHED (must be Approved first)', () => {
    expect(() => assertValidCourseTransition('SUBMITTED_FOR_REVIEW', 'PUBLISHED')).toThrow(AppError);
  });

  it('allows the full happy-path chain: DRAFT -> SUBMITTED_FOR_REVIEW -> APPROVED -> PUBLISHED', () => {
    expect(() => assertValidCourseTransition('DRAFT', 'SUBMITTED_FOR_REVIEW')).not.toThrow();
    expect(() => assertValidCourseTransition('SUBMITTED_FOR_REVIEW', 'APPROVED')).not.toThrow();
    expect(() => assertValidCourseTransition('APPROVED', 'PUBLISHED')).not.toThrow();
  });

  it('allows the changes-requested resubmission loop: SUBMITTED_FOR_REVIEW -> CHANGES_REQUESTED -> SUBMITTED_FOR_REVIEW', () => {
    expect(() => assertValidCourseTransition('SUBMITTED_FOR_REVIEW', 'CHANGES_REQUESTED')).not.toThrow();
    expect(() => assertValidCourseTransition('CHANGES_REQUESTED', 'SUBMITTED_FOR_REVIEW')).not.toThrow();
  });

  it('rejects RETIRED -> anything (true terminal state)', () => {
    expect(() => assertValidCourseTransition('RETIRED', 'DRAFT')).toThrow(AppError);
    expect(() => assertValidCourseTransition('RETIRED', 'PUBLISHED')).toThrow(AppError);
    expect(COURSE_VALID_TRANSITIONS.RETIRED).toEqual([]);
  });

  it('rejects ARCHIVED -> PUBLISHED directly (must be revived to DRAFT and re-reviewed first)', () => {
    expect(() => assertValidCourseTransition('ARCHIVED', 'PUBLISHED')).toThrow(AppError);
  });

  it('allows ARCHIVED -> RETIRED (permanent retirement of an archived course)', () => {
    expect(() => assertValidCourseTransition('ARCHIVED', 'RETIRED')).not.toThrow();
  });

  it('allows PUBLISHED -> UNLISTED and PUBLISHED -> ENROLLMENT_PAUSED (FR-015 operational states)', () => {
    expect(() => assertValidCourseTransition('PUBLISHED', 'UNLISTED')).not.toThrow();
    expect(() => assertValidCourseTransition('PUBLISHED', 'ENROLLMENT_PAUSED')).not.toThrow();
  });

  it('rejects an unrecognized status name', () => {
    expect(() => assertValidCourseTransition('DRAFT', 'NOT_A_REAL_STATUS')).toThrow(AppError);
  });
});

const validPublishFields = {
  title: 'A Course',
  slug: 'a-course',
  shortDescription: 'Short desc',
  description: 'Full desc',
  categoryId: 'cat-1',
  thumbnailUrl: 'https://example.com/x.jpg',
  publishAt: null,
  expireAt: null,
  seoTitle: null,
  seoDescription: null,
};

describe('course-lifecycle.policy — assertPublishReady() (checked at SUBMITTED_FOR_REVIEW -> APPROVED)', () => {
  it('accepts a course with every required field present', () => {
    expect(() => assertPublishReady(validPublishFields)).not.toThrow();
  });

  it.each(['title', 'slug', 'shortDescription', 'description', 'categoryId', 'thumbnailUrl'])(
    'rejects a course missing %s',
    (field) => {
      const broken = { ...validPublishFields, [field]: field === 'categoryId' ? null : '' };
      expect(() => assertPublishReady(broken as never)).toThrow(AppError);
    },
  );

  it('does NOT require seoTitle/seoDescription (title/shortDescription are an acceptable fallback)', () => {
    expect(() => assertPublishReady({ ...validPublishFields, seoTitle: null, seoDescription: null })).not.toThrow();
  });

  it('rejects publishAt at or after expireAt', () => {
    const broken = {
      ...validPublishFields,
      publishAt: new Date('2030-01-02'),
      expireAt: new Date('2030-01-01'),
    };
    expect(() => assertPublishReady(broken)).toThrow(AppError);
  });
});

describe('course-lifecycle.policy — assertHasPublishableModule()', () => {
  it('rejects zero modules', () => {
    expect(() => assertHasPublishableModule(0)).toThrow(/at least one module/i);
  });

  it('accepts one or more modules', () => {
    expect(() => assertHasPublishableModule(1)).not.toThrow();
    expect(() => assertHasPublishableModule(5)).not.toThrow();
  });
});

describe('course-lifecycle.policy — isCoursePubliclyVisible() (read-time publish/expiry window, LISTING rule)', () => {
  const base = { status: 'PUBLISHED', publishAt: null, expireAt: null };

  it('is visible when PUBLISHED with no window restrictions', () => {
    expect(isCoursePubliclyVisible(base)).toBe(true);
  });

  it('is visible when SCHEDULED and past its publishAt date (no background worker — read-time check does the work)', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isCoursePubliclyVisible({ status: 'SCHEDULED', publishAt: past, expireAt: null })).toBe(true);
  });

  it('is NOT visible when SCHEDULED and publishAt is still in the future', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isCoursePubliclyVisible({ status: 'SCHEDULED', publishAt: future, expireAt: null })).toBe(false);
  });

  it('is visible when ENROLLMENT_PAUSED (informational — no Enrollment model exists yet to actually block new signups)', () => {
    expect(isCoursePubliclyVisible({ ...base, status: 'ENROLLMENT_PAUSED' })).toBe(true);
  });

  it('is NOT visible for DRAFT, SUBMITTED_FOR_REVIEW, CHANGES_REQUESTED, APPROVED, UNLISTED, ARCHIVED, or RETIRED', () => {
    for (const status of [
      'DRAFT',
      'SUBMITTED_FOR_REVIEW',
      'CHANGES_REQUESTED',
      'APPROVED',
      'UNLISTED',
      'ARCHIVED',
      'RETIRED',
    ]) {
      expect(isCoursePubliclyVisible({ ...base, status })).toBe(false);
    }
  });

  it('is NOT visible before its publishAt time', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isCoursePubliclyVisible({ ...base, publishAt: future })).toBe(false);
  });

  it('is NOT visible after its expireAt time', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isCoursePubliclyVisible({ ...base, expireAt: past })).toBe(false);
  });
});

describe('course-lifecycle.policy — isCourseVisibleByDirectLink() (DETAIL-ONLY rule, additionally allows UNLISTED)', () => {
  it('allows UNLISTED via direct link (FR-015: "accessible only via direct link or explicit assignment")', () => {
    expect(isCourseVisibleByDirectLink({ status: 'UNLISTED', publishAt: null, expireAt: null })).toBe(true);
  });

  it('still respects the publish/expire window for an UNLISTED course', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isCourseVisibleByDirectLink({ status: 'UNLISTED', publishAt: future, expireAt: null })).toBe(false);
  });

  it('falls through to the same rule as isCoursePubliclyVisible() for non-UNLISTED statuses', () => {
    expect(isCourseVisibleByDirectLink({ status: 'PUBLISHED', publishAt: null, expireAt: null })).toBe(true);
    expect(isCourseVisibleByDirectLink({ status: 'DRAFT', publishAt: null, expireAt: null })).toBe(false);
  });
});
