import { z } from 'zod';

export const initiateCheckoutSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    email: z.string().trim().email().optional(),
    utmSource: z.string().trim().max(120).optional(),
    utmMedium: z.string().trim().max(120).optional(),
    utmCampaign: z.string().trim().max(120).optional(),
  }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({ sessionId: z.string().uuid() }),
});

export const applyCouponSchema = z.object({
  params: z.object({ sessionId: z.string().uuid() }),
  body: z.object({ code: z.string().trim().min(1).max(60) }),
});

export const recordStepSchema = z.object({
  params: z.object({ sessionId: z.string().uuid() }),
  body: z.object({ step: z.string().trim().min(1).max(60) }),
});

export const webhookQuerySchema = z.object({
  params: z.object({ sessionId: z.string().uuid() }),
});

export const markAbandonedSchema = z.object({
  body: z.object({ idleMinutes: z.number().int().positive().optional() }),
});
