import { z } from 'zod';

const uuid = () => z.string().uuid();

/**
 * Typed, discriminated-by-activity-kind learning position (Part 2B's
 * explicit "typed learning-position persistence" requirement — not a
 * free-form blob). Bounded per-field so a malicious/buggy client can never
 * persist an absurd value (e.g. a negative position, a scroll percent over
 * 100, a page number in the billions).
 */
export const lastPositionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('video'), positionSeconds: z.number().min(0).max(24 * 3600) }),
  z.object({ kind: z.literal('audio'), positionSeconds: z.number().min(0).max(24 * 3600) }),
  z.object({ kind: z.literal('article'), scrollPercent: z.number().min(0).max(100) }),
  z.object({ kind: z.literal('pdf'), pageNumber: z.number().int().min(1).max(100000) }),
]);

// Bounded increment (Part 2B "time-spent tracking safety... bounded
// increments") — a single progress-update request can never claim more
// than 1 hour of time spent, regardless of the actual client-side elapsed
// time between calls. This caps the damage a single malicious/buggy
// request can do; `progress.service.ts` additionally never lets total
// `timeSpentSeconds` exceed a lesson's own generous sanity ceiling.
const MAX_TIME_SPENT_DELTA_SECONDS = 3600;

export const updateLessonProgressSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z
    .object({
      timeSpentDeltaSeconds: z.number().int().min(0).max(MAX_TIME_SPENT_DELTA_SECONDS).optional(),
      /** 0–100 — the caller's OWN observed watch/read percentage for this session; the server only ever takes the max against the stored value (anti-rollback). */
      watchedPercent: z.number().min(0).max(100).optional(),
      lastPosition: lastPositionSchema.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const completeLessonSchema = z.object({
  params: z.object({ lessonId: uuid() }),
});

export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });

export { MAX_TIME_SPENT_DELTA_SECONDS };
