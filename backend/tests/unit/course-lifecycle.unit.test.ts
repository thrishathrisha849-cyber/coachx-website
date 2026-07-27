import {
  COURSE_VALID_TRANSITIONS,
  assertValidCourseTransition,
  assertPublishReady,
  assertHasPublishableModule,
  isCoursePubliclyVisible,
} from '../../src/lms/course-lifecycle.policy';
import { AppError } from '../../src/utils/app-error';

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

  it('rejects ARCHIVED -> PUBLISHED (an archived course must be revived to DRAFT first)', () => {
    expect(() => assertValidCourseTransition('ARCHIVED', 'PUBLISHED')).toThrow(AppError);
  });

  it('allows PUBLISHED -> UNPUBLISHED and back', () => {
    expect(() => assertValidCourseTransition('PUBLISHED', 'UNPUBLISHED')).not.toThrow();
    expect(() => assertValidCourseTransition('UNPUBLISHED', 'PUBLISHED')).not.toThrow();
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
  visibility: 'PUBLIC',
  publishAt: null,
  expireAt: null,
  seoTitle: null,
  seoDescription: null,
};

describe('course-lifecycle.policy — assertPublishReady()', () => {
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

describe('course-lifecycle.policy — isCoursePubliclyVisible() (read-time publish/expiry window)', () => {
  const base = { status: 'PUBLISHED', visibility: 'PUBLIC', publishAt: null, expireAt: null };

  it('is visible when PUBLISHED with no window restrictions', () => {
    expect(isCoursePubliclyVisible(base)).toBe(true);
  });

  it('is NOT visible when status is not PUBLISHED', () => {
    expect(isCoursePubliclyVisible({ ...base, status: 'DRAFT' })).toBe(false);
    expect(isCoursePubliclyVisible({ ...base, status: 'ARCHIVED' })).toBe(false);
  });

  it('is NOT visible before its publishAt time', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isCoursePubliclyVisible({ ...base, publishAt: future })).toBe(false);
  });

  it('is NOT visible after its expireAt time', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isCoursePubliclyVisible({ ...base, expireAt: past })).toBe(false);
  });

  it('is visible for UNLISTED the same as PUBLIC (reachable by direct link)', () => {
    expect(isCoursePubliclyVisible({ ...base, visibility: 'UNLISTED' })).toBe(true);
  });
});
