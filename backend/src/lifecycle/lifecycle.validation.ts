import { z } from 'zod';
import { MILESTONE_TYPES } from './milestone.service';

export const submitOnboardingSchema = z.object({
  body: z.object({
    languageSelected: z.string().max(10).optional(),
    goalSelected: z.string().max(120).optional(),
    experienceLevel: z.string().max(60).optional(),
    skillSelected: z.string().max(120).optional(),
    businessStage: z.string().max(60).optional(),
    timeAvailability: z.string().max(60).optional(),
    interests: z.array(z.string().max(60)).max(20).optional(),
  }),
});

export const selectNicheSchema = z.object({
  body: z.object({ niche: z.string().trim().min(2).max(120) }),
});

export const claimMilestoneSchema = z.object({
  body: z.object({
    type: z.enum(MILESTONE_TYPES),
    evidence: z.unknown().optional(),
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const milestoneIdParamSchema = z.object({
  params: z.object({ milestoneId: z.string().uuid() }),
});

export const rejectMilestoneSchema = z.object({
  params: z.object({ milestoneId: z.string().uuid() }),
  body: z.object({ reason: z.string().trim().min(3).max(500) }),
});
