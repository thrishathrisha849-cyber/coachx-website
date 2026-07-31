import { z } from 'zod';

const uuid = () => z.string().uuid();

export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
export const waitlistEntryIdParamSchema = z.object({ params: z.object({ id: uuid() }) });

export const joinWaitlistSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({
    referralSource: z.string().trim().max(100).optional(),
  }),
});
