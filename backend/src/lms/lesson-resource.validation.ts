import { z } from 'zod';

const uuid = () => z.string().uuid();

/** https-only (or a relative internal `/storage/...` reference) — same convention `lesson.validation.ts`'s activity schemas already use. */
const safeUrl = z
  .string()
  .max(500)
  .refine((value) => /^https:\/\//i.test(value) || value.startsWith('/'), {
    message: 'URL must use https:// or be an internal storage path',
  });

export const RESOURCE_TYPES = ['PDF', 'WORKSHEET', 'SPREADSHEET', 'TEMPLATE', 'IMAGE', 'AUDIO', 'ZIP', 'PRESENTATION', 'PROMPT_PACK'] as const;
export const RESOURCE_DOWNLOAD_PERMISSIONS = ['VIEW_ONLY', 'DOWNLOADABLE'] as const;
export const RESOURCE_ACCESS_RULES = ['PREVIEW', 'ENROLLED_ONLY'] as const;

export const lessonIdParamSchema = z.object({ params: z.object({ lessonId: uuid() }) });
export const resourceIdParamSchema = z.object({ params: z.object({ resourceId: uuid() }) });

export const createResourceSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    type: z.enum(RESOURCE_TYPES),
    description: z.string().trim().max(2000).optional(),
    language: z.string().trim().min(2).max(10).optional(),
    fileUrl: safeUrl,
    fileSizeBytes: z.number().int().min(0).max(10 * 1024 * 1024 * 1024).optional(),
    downloadPermission: z.enum(RESOURCE_DOWNLOAD_PERMISSIONS).optional(),
    accessRule: z.enum(RESOURCE_ACCESS_RULES).optional(),
    position: z.number().int().min(0).max(100000).optional(),
  }),
});

export const updateResourceSchema = z.object({
  params: z.object({ resourceId: uuid() }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200),
      type: z.enum(RESOURCE_TYPES),
      description: z.string().trim().max(2000).nullable(),
      language: z.string().trim().min(2).max(10),
      fileUrl: safeUrl,
      fileSizeBytes: z.number().int().min(0).max(10 * 1024 * 1024 * 1024).nullable(),
      downloadPermission: z.enum(RESOURCE_DOWNLOAD_PERMISSIONS),
      accessRule: z.enum(RESOURCE_ACCESS_RULES),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
      bumpVersion: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const reorderResourcesSchema = z.object({
  params: z.object({ lessonId: uuid() }),
  body: z.object({ orderedIds: z.array(uuid()).min(1) }),
});
