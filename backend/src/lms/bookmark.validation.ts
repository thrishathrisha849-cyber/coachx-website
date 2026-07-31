import { z } from 'zod';

const uuid = () => z.string().uuid();

export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });
export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
export const bookmarkIdParamSchema = z.object({ params: z.object({ bookmarkId: uuid() }) });

const noteAndFolder = z.object({
  note: z.string().trim().max(2000).optional(),
  folder: z.string().trim().max(100).optional(),
});

/**
 * FR-059's four creatable types (`DISCUSSION` is deliberately NOT a member
 * of this union — no Discussion entity exists in this codebase yet, spec
 * 005 — so the Zod discriminator itself rejects it with a clear
 * "invalid discriminator value" error, before it ever reaches the service).
 */
export const createBookmarkSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.discriminatedUnion('type', [
    noteAndFolder.extend({ type: z.literal('LESSON') }),
    noteAndFolder.extend({ type: z.literal('VIDEO_TIMESTAMP'), videoTimestampSeconds: z.number().int().min(0).max(24 * 60 * 60) }),
    noteAndFolder.extend({ type: z.literal('TEXT_SECTION'), textSectionAnchor: z.string().trim().min(1).max(255) }),
    noteAndFolder.extend({ type: z.literal('RESOURCE'), activityId: uuid() }),
  ]),
});
