import { z } from 'zod';

const uuid = () => z.string().uuid();

export const ANNOUNCEMENT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const ANNOUNCEMENT_CHANNELS = ['IN_APP', 'EMAIL', 'PUSH'] as const;

export const courseAnnouncementsParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
export const announcementIdParamSchema = z.object({ params: z.object({ announcementId: uuid() }) });

export const createAnnouncementSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({
    moduleId: uuid().nullable().optional(),
    title: z.string().trim().min(2).max(200),
    message: z.string().trim().min(1).max(20000),
    priority: z.enum(ANNOUNCEMENT_PRIORITIES).default('NORMAL'),
    channels: z.array(z.enum(ANNOUNCEMENT_CHANNELS)).min(1).max(3).default(['IN_APP']),
    attachmentUrl: z.string().url().max(500).nullable().optional(),
    publishAt: z.string().datetime().nullable().optional(),
    expireAt: z.string().datetime().nullable().optional(),
  }),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({ announcementId: uuid() }),
  body: z
    .object({
      moduleId: uuid().nullable(),
      title: z.string().trim().min(2).max(200),
      message: z.string().trim().min(1).max(20000),
      priority: z.enum(ANNOUNCEMENT_PRIORITIES),
      channels: z.array(z.enum(ANNOUNCEMENT_CHANNELS)).min(1).max(3),
      attachmentUrl: z.string().url().max(500).nullable(),
      publishAt: z.string().datetime().nullable(),
      expireAt: z.string().datetime().nullable(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});
