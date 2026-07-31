import { z } from 'zod';

const uuid = () => z.string().uuid();

export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });
export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
export const noteIdParamSchema = z.object({ params: z.object({ noteId: uuid() }) });

export const createNoteSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.object({
    content: z.string().trim().min(1).max(20_000),
    videoTimestampSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({ noteId: uuid() }),
  body: z
    .object({
      content: z.string().trim().min(1).max(20_000),
      videoTimestampSeconds: z.number().int().min(0).max(24 * 60 * 60).nullable(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const searchNotesQuerySchema = z.object({
  query: z.object({ q: z.string().trim().min(1).max(200), courseId: uuid().optional() }),
});

export const exportNotesQuerySchema = z.object({ query: z.object({ courseId: uuid().optional() }) });
