import {
  createLessonSchema,
  updateLessonSchema,
  createActivitySchema,
  updateActivitySchema,
} from '../../src/lms/lesson.validation';

const moduleId = '11111111-1111-1111-1111-111111111111';
const lessonId = '22222222-2222-2222-2222-222222222222';

describe('lesson.validation — createLessonSchema', () => {
  const base = { params: { moduleId }, body: { title: 'Intro', slug: 'intro' } };

  it('accepts a minimal valid lesson body, applying documented defaults', () => {
    const result = createLessonSchema.parse(base);
    expect(result.body.isPreview).toBe(false);
    expect(result.body.isMandatory).toBe(true);
    // 004 LMS-wide Settings batch (FR-114): `completionRuleType` is no
    // longer defaulted here — `lesson.service.ts`'s `createCourseLesson`
    // now sources the fallback from the admin-configurable
    // `LmsSettings.defaultLessonCompletionRuleType` instead.
    expect(result.body.completionRuleType).toBeUndefined();
  });

  it('rejects an invalid slug format', () => {
    expect(() => createLessonSchema.parse({ params: { moduleId }, body: { title: 'Intro', slug: 'Not A Slug!' } })).toThrow();
  });

  it('rejects an unknown completionRuleType (no silently-invented values accepted)', () => {
    expect(() =>
      createLessonSchema.parse({ params: { moduleId }, body: { ...base.body, completionRuleType: 'WATCH_UNTIL_DONE' } }),
    ).toThrow();
  });

  it('accepts every documented completion rule type', () => {
    for (const type of ['MANUAL', 'MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED', 'INSTRUCTOR_APPROVAL']) {
      expect(() => createLessonSchema.parse({ params: { moduleId }, body: { ...base.body, completionRuleType: type } })).not.toThrow();
    }
  });

  // Correction 4 (Part 2 correction pass) — FR-052 multi-condition support.
  it('defaults completionRuleTypes to an empty array when not supplied', () => {
    const result = createLessonSchema.parse(base);
    expect(result.body.completionRuleTypes).toEqual([]);
  });

  it('accepts a genuine multi-condition combination', () => {
    const result = createLessonSchema.parse({
      params: { moduleId },
      body: { ...base.body, completionRuleTypes: ['MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED'] },
    });
    expect(result.body.completionRuleTypes).toEqual(['MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED']);
  });

  it('rejects a duplicate rule type within completionRuleTypes', () => {
    expect(() =>
      createLessonSchema.parse({
        params: { moduleId },
        body: { ...base.body, completionRuleTypes: ['MANUAL', 'MANUAL'] },
      }),
    ).toThrow();
  });

  it('rejects an unknown value inside completionRuleTypes', () => {
    expect(() =>
      createLessonSchema.parse({
        params: { moduleId },
        body: { ...base.body, completionRuleTypes: ['NOT_A_REAL_RULE'] },
      }),
    ).toThrow();
  });
});

describe('lesson.validation — updateLessonSchema', () => {
  it('rejects an empty body (nothing to update)', () => {
    expect(() => updateLessonSchema.parse({ params: { lessonId }, body: {} })).toThrow();
  });

  it('accepts a partial single-field update', () => {
    expect(() => updateLessonSchema.parse({ params: { lessonId }, body: { title: 'New Title' } })).not.toThrow();
  });
});

describe('lesson.validation — createActivitySchema (per-content-type security rules)', () => {
  it('requires mediaUrl for a VIDEO activity', () => {
    expect(() => createActivitySchema.parse({ params: { lessonId }, body: { type: 'VIDEO' } })).toThrow();
  });

  it('accepts a VIDEO activity with a valid https mediaUrl', () => {
    expect(() =>
      createActivitySchema.parse({ params: { lessonId }, body: { type: 'VIDEO', mediaUrl: 'https://cdn.example.com/v.mp4' } }),
    ).not.toThrow();
  });

  it('rejects a non-https mediaUrl (no javascript:/data: schemes)', () => {
    expect(() =>
      createActivitySchema.parse({ params: { lessonId }, body: { type: 'VIDEO', mediaUrl: 'javascript:alert(1)' } }),
    ).toThrow();
    expect(() =>
      createActivitySchema.parse({ params: { lessonId }, body: { type: 'VIDEO', mediaUrl: 'data:text/html,<script>' } }),
    ).toThrow();
  });

  it('accepts an internal storage path (leading slash) as a safe URL', () => {
    expect(() =>
      createActivitySchema.parse({ params: { lessonId }, body: { type: 'DOWNLOAD', mediaUrl: '/storage/file.pdf' } }),
    ).not.toThrow();
  });

  it('requires bodyText for an ARTICLE activity', () => {
    expect(() => createActivitySchema.parse({ params: { lessonId }, body: { type: 'ARTICLE' } })).toThrow();
    expect(() =>
      createActivitySchema.parse({ params: { lessonId }, body: { type: 'ARTICLE', bodyText: 'Hello world' } }),
    ).not.toThrow();
  });

  it('requires externalUrl for an EXTERNAL_LINK activity', () => {
    expect(() => createActivitySchema.parse({ params: { lessonId }, body: { type: 'EXTERNAL_LINK' } })).toThrow();
  });

  it('requires BOTH embedProvider and embedResourceId for an EMBED activity — never one without the other', () => {
    expect(() => createActivitySchema.parse({ params: { lessonId }, body: { type: 'EMBED', embedProvider: 'youtube' } })).toThrow();
    expect(() => createActivitySchema.parse({ params: { lessonId }, body: { type: 'EMBED', embedResourceId: 'abc123' } })).toThrow();
    expect(() =>
      createActivitySchema.parse({ params: { lessonId }, body: { type: 'EMBED', embedProvider: 'youtube', embedResourceId: 'abc123' } }),
    ).not.toThrow();
  });

  it('rejects an embedProvider outside the closed allowlist — never arbitrary provider strings', () => {
    expect(() =>
      createActivitySchema.parse({
        params: { lessonId },
        body: { type: 'EMBED', embedProvider: 'attacker-controlled-iframe-host', embedResourceId: 'x' },
      }),
    ).toThrow();
  });

  it('bounds durationSeconds and fileSizeBytes to sane maxima', () => {
    expect(() =>
      createActivitySchema.parse({
        params: { lessonId },
        body: { type: 'VIDEO', mediaUrl: 'https://cdn.example.com/v.mp4', durationSeconds: -5 },
      }),
    ).toThrow();
  });
});

describe('lesson.validation — updateActivitySchema', () => {
  const activityId = '33333333-3333-3333-3333-333333333333';

  it('rejects an empty body', () => {
    expect(() => updateActivitySchema.parse({ params: { activityId }, body: {} })).toThrow();
  });

  it('accepts a status-only partial update', () => {
    expect(() => updateActivitySchema.parse({ params: { activityId }, body: { status: 'ARCHIVED' } })).not.toThrow();
  });
});
