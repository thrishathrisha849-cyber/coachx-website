import { updateLessonProgressSchema, lastPositionSchema } from '../../src/lms/progress.validation';
import { selfEnrollSchema, adminCreateEnrollmentSchema } from '../../src/lms/enrollment.validation';

const lessonId = '11111111-1111-1111-1111-111111111111';
const courseId = '22222222-2222-2222-2222-222222222222';
const userId = '33333333-3333-3333-3333-333333333333';

describe('progress.validation — lastPositionSchema (typed, bounded, discriminated by activity kind)', () => {
  it('accepts a valid video position', () => {
    expect(() => lastPositionSchema.parse({ kind: 'video', positionSeconds: 120 })).not.toThrow();
  });

  it('rejects a negative video position', () => {
    expect(() => lastPositionSchema.parse({ kind: 'video', positionSeconds: -1 })).toThrow();
  });

  it('rejects an absurdly large video position (bounded, not unbounded)', () => {
    expect(() => lastPositionSchema.parse({ kind: 'video', positionSeconds: 999_999_999 })).toThrow();
  });

  it('accepts a valid article scroll percent, rejects out-of-range values', () => {
    expect(() => lastPositionSchema.parse({ kind: 'article', scrollPercent: 55 })).not.toThrow();
    expect(() => lastPositionSchema.parse({ kind: 'article', scrollPercent: 150 })).toThrow();
  });

  it('accepts a valid PDF page number, rejects zero/negative pages', () => {
    expect(() => lastPositionSchema.parse({ kind: 'pdf', pageNumber: 3 })).not.toThrow();
    expect(() => lastPositionSchema.parse({ kind: 'pdf', pageNumber: 0 })).toThrow();
  });

  it('rejects a kind that mixes fields from another discriminant (e.g. video shape with pageNumber)', () => {
    expect(() => lastPositionSchema.parse({ kind: 'video', pageNumber: 3 })).toThrow();
  });

  it('rejects an unrecognized kind entirely', () => {
    expect(() => lastPositionSchema.parse({ kind: 'holographic', positionSeconds: 1 })).toThrow();
  });
});

describe('progress.validation — updateLessonProgressSchema (bounded time-spent increments)', () => {
  it('rejects an empty body', () => {
    expect(() => updateLessonProgressSchema.parse({ params: { lessonId }, body: {} })).toThrow();
  });

  it('accepts a bounded timeSpentDeltaSeconds', () => {
    expect(() =>
      updateLessonProgressSchema.parse({ params: { lessonId }, body: { timeSpentDeltaSeconds: 300 } }),
    ).not.toThrow();
  });

  it('rejects a timeSpentDeltaSeconds beyond the 1-hour single-request ceiling', () => {
    expect(() =>
      updateLessonProgressSchema.parse({ params: { lessonId }, body: { timeSpentDeltaSeconds: 3601 } }),
    ).toThrow();
  });

  it('rejects a negative timeSpentDeltaSeconds', () => {
    expect(() =>
      updateLessonProgressSchema.parse({ params: { lessonId }, body: { timeSpentDeltaSeconds: -10 } }),
    ).toThrow();
  });

  it('accepts watchedPercent within 0-100 and rejects outside it', () => {
    expect(() => updateLessonProgressSchema.parse({ params: { lessonId }, body: { watchedPercent: 80 } })).not.toThrow();
    expect(() => updateLessonProgressSchema.parse({ params: { lessonId }, body: { watchedPercent: 101 } })).toThrow();
  });
});

describe('enrollment.validation — selfEnrollSchema (learner can never supply their own entitlement source)', () => {
  it('accepts only a courseId — no source/userId field exists on the schema at all', () => {
    const parsed = selfEnrollSchema.parse({ body: { courseId } });
    expect(parsed.body).toEqual({ courseId });
    expect('source' in parsed.body).toBe(false);
    expect('userId' in parsed.body).toBe(false);
  });

  it('strips an attempted source/userId smuggling attempt — Zod default unknown-key stripping means even a malicious caller supplying source/userId in the body has it discarded before it ever reaches the service layer', () => {
    const raw: unknown = { body: { courseId, source: 'ADMIN_GRANT', userId: 'someone-elses-id' } };
    const parsed = selfEnrollSchema.parse(raw);
    expect(parsed.body).toEqual({ courseId });
  });
});

describe('enrollment.validation — adminCreateEnrollmentSchema', () => {
  it('requires both userId and courseId', () => {
    expect(() => adminCreateEnrollmentSchema.parse({ body: { courseId } })).toThrow();
    expect(() => adminCreateEnrollmentSchema.parse({ body: { userId } })).toThrow();
  });

  it('defaults source to ADMIN_GRANT when omitted', () => {
    const parsed = adminCreateEnrollmentSchema.parse({ body: { userId, courseId } });
    expect(parsed.body.source).toBe('ADMIN_GRANT');
  });

  it('accepts every documented enrollment source value', () => {
    for (const source of ['FREE', 'MEMBERSHIP', 'PURCHASE', 'PROGRAM', 'ORGANIZATION', 'ADMIN_GRANT', 'COUPON', 'SCHOLARSHIP', 'TRIAL', 'INVITE']) {
      expect(() => adminCreateEnrollmentSchema.parse({ body: { userId, courseId, source } })).not.toThrow();
    }
  });
});
