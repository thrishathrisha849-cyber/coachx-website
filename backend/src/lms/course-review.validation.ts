import { z } from 'zod';

const uuid = () => z.string().uuid();

export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
export const reviewIdParamSchema = z.object({ params: z.object({ reviewId: uuid() }) });

export const submitReviewSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(200).optional(),
    comment: z.string().trim().max(5000).optional(),
    outcome: z.string().trim().max(500).optional(),
    wouldRecommend: z.boolean().default(true),
    isAnonymous: z.boolean().default(false),
  }),
});

export const moderateReviewSchema = z.object({
  params: z.object({ reviewId: uuid() }),
  body: z.object({
    action: z.enum(['HIDE', 'RESTORE']),
    reason: z.string().trim().max(1000).optional(),
  }),
});
