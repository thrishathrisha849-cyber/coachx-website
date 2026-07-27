import { z } from 'zod';

/**
 * Phase 6 Part 2A — Lesson + LearningActivity request validation. Same
 * Zod + `validate()` middleware convention as `lms.validation.ts`.
 */

const uuid = () => z.string().uuid();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const METADATA_MAX_BYTES = 8 * 1024;
const completionRuleValueSchema = z
  .record(z.unknown())
  .optional()
  .refine((value) => value === undefined || JSON.stringify(value).length <= METADATA_MAX_BYTES, {
    message: `completionRuleValue must serialize to at most ${METADATA_MAX_BYTES} bytes`,
  });

export const LESSON_COMPLETION_RULE_TYPES = [
  'MANUAL',
  'MINIMUM_WATCH_PERCENT',
  'ALL_ACTIVITIES_VIEWED',
  'INSTRUCTOR_APPROVAL',
] as const;

export const LESSON_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

// ============================================================================
// Lessons
// ============================================================================

const lessonBodyBase = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().regex(slugPattern, 'Invalid slug format').max(220),
  summary: z.string().max(500).optional(),
  description: z.string().max(20000).optional(),
  position: z.number().int().min(0).max(100000).optional(),
  durationMinutes: z.number().int().min(0).max(100000).optional(),
  isPreview: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
  completionRuleType: z.enum(LESSON_COMPLETION_RULE_TYPES).default('MANUAL'),
  /**
   * CORRECTION (Part 2 correction pass) — FR-052: "MUST allow a single
   * lesson to combine multiple required conditions." When supplied and
   * non-empty, this is the authoritative multi-condition set (AND-combined
   * — see completion.service.ts's `getEffectiveCompletionRules`);
   * `completionRuleType` above remains the single-condition fallback for
   * backward compatibility. Deduplicated and capped at one of each rule
   * type (a lesson combining "MINIMUM_WATCH_PERCENT twice" is meaningless).
   */
  completionRuleTypes: z
    .array(z.enum(LESSON_COMPLETION_RULE_TYPES))
    .max(LESSON_COMPLETION_RULE_TYPES.length)
    .refine((arr) => new Set(arr).size === arr.length, { message: 'completionRuleTypes must not contain duplicate values' })
    .default([]),
  completionRuleValue: completionRuleValueSchema,
});

export const createLessonSchema = z.object({
  params: z.object({ moduleId: uuid() }),
  body: lessonBodyBase,
});

export const updateLessonSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: lessonBodyBase
    .partial()
    .extend({ status: z.enum(LESSON_STATUS_VALUES).optional() })
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const reorderLessonsSchema = z.object({
  params: z.object({ moduleId: uuid() }),
  body: z.object({ orderedIds: z.array(uuid()).min(1).max(1000) }),
});

export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });

export const moduleLessonsParamSchema = z.object({ params: z.object({ moduleId: uuid() }) });

// ============================================================================
// Learning Activities
// ============================================================================

export const LEARNING_ACTIVITY_TYPES = ['VIDEO', 'AUDIO', 'ARTICLE', 'PDF', 'DOWNLOAD', 'EXTERNAL_LINK', 'EMBED'] as const;

/**
 * Closed provider allowlist for EMBED activities (Part 2C security review:
 * "typed provider+resource IDs only, no arbitrary iframe HTML"). Adding a
 * new provider is a deliberate, reviewed code change — never
 * caller-suppliable.
 */
export const EMBED_PROVIDERS = ['youtube', 'vimeo', 'google_drive', 'loom'] as const;

/** https-only (or a relative internal `/storage/...` reference) — never `javascript:`, `data:`, `file:`, etc. */
const safeUrl = z
  .string()
  .max(500)
  .refine((value) => /^https:\/\//i.test(value) || value.startsWith('/'), {
    message: 'URL must use https:// or be an internal storage path',
  });

const activityBodyBase = z
  .object({
    type: z.enum(LEARNING_ACTIVITY_TYPES),
    title: z.string().max(200).optional(),
    position: z.number().int().min(0).max(100000).optional(),
    mediaUrl: safeUrl.optional(),
    externalUrl: safeUrl.optional(),
    bodyText: z.string().max(50000).optional(),
    durationSeconds: z.number().int().min(0).max(24 * 3600).optional(),
    fileSizeBytes: z.number().int().min(0).max(10 * 1024 * 1024 * 1024).optional(),
    embedProvider: z.enum(EMBED_PROVIDERS).optional(),
    embedResourceId: z.string().trim().min(1).max(200).optional(),
  })
  // Per-content-type required-field rules (Part 2C "per-content-type
  // security rules" — a VIDEO/AUDIO/DOWNLOAD/PDF activity must carry a
  // typed mediaUrl, not an empty shell; an EMBED must carry BOTH a
  // known-allowlisted provider AND a resource id, never one without the
  // other; an EXTERNAL_LINK must carry a safe externalUrl; an ARTICLE must
  // carry bodyText.
  .superRefine((body, ctx) => {
    const requireField = (cond: boolean, field: keyof typeof body, message: string) => {
      if (!cond) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    };

    switch (body.type) {
      case 'VIDEO':
      case 'AUDIO':
      case 'DOWNLOAD':
      case 'PDF':
        requireField(!!body.mediaUrl, 'mediaUrl', `${body.type} activities require mediaUrl`);
        break;
      case 'EXTERNAL_LINK':
        requireField(!!body.externalUrl, 'externalUrl', 'EXTERNAL_LINK activities require externalUrl');
        break;
      case 'ARTICLE':
        requireField(!!body.bodyText, 'bodyText', 'ARTICLE activities require bodyText');
        break;
      case 'EMBED':
        requireField(!!body.embedProvider, 'embedProvider', 'EMBED activities require an allowlisted embedProvider');
        requireField(!!body.embedResourceId, 'embedResourceId', 'EMBED activities require embedResourceId');
        break;
    }
  });

export const createActivitySchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: activityBodyBase,
});

// `.partial()` isn't available after `.superRefine()` — the update schema
// intentionally does not re-validate cross-field per-type requirements on
// partial updates (same pragmatic tradeoff `updateModuleSchema` makes); a
// caller changing `type` on an existing activity should PATCH the
// type-relevant fields in the same request, which the service layer's
// re-fetch-then-merge validation (see `activity.service.ts`) re-checks.
export const updateActivitySchema = z.object({
  params: z.object({ activityId: uuid() }),
  body: z
    .object({
      type: z.enum(LEARNING_ACTIVITY_TYPES).optional(),
      title: z.string().max(200).nullable().optional(),
      mediaUrl: safeUrl.nullable().optional(),
      externalUrl: safeUrl.nullable().optional(),
      bodyText: z.string().max(50000).nullable().optional(),
      durationSeconds: z.number().int().min(0).max(24 * 3600).nullable().optional(),
      fileSizeBytes: z.number().int().min(0).max(10 * 1024 * 1024 * 1024).nullable().optional(),
      embedProvider: z.enum(EMBED_PROVIDERS).nullable().optional(),
      embedResourceId: z.string().trim().min(1).max(200).nullable().optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const reorderActivitiesSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.object({ orderedIds: z.array(uuid()).min(1).max(1000) }),
});

export const activityIdParamSchema = z.object({ params: z.object({ activityId: uuid() }) });

export const lessonActivitiesParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });
