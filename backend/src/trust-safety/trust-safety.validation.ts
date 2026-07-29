import { z } from 'zod';

export const fileCaseSchema = z.object({
  body: z.object({
    type: z.enum(['REPORT', 'BLOCK', 'MUTE']),
    targetType: z.enum(['POST', 'COMMENT', 'PROFILE', 'USER']),
    targetId: z.string().max(120).optional(),
    reportedUserId: z.string().uuid().optional(),
    reason: z.string().trim().min(3).max(2000),
    evidence: z.unknown().optional(),
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const caseIdParamSchema = z.object({
  params: z.object({ caseId: z.string().uuid() }),
});

export const actionCaseSchema = z.object({
  params: z.object({ caseId: z.string().uuid() }),
  body: z.object({
    actionType: z.enum(['WARNING', 'TEMPORARY_SUSPENSION', 'PERMANENT_BAN']),
    actionReason: z.string().trim().min(3).max(1000),
    suspensionDurationMin: z.coerce.number().int().positive().optional(),
  }),
});

export const dismissCaseSchema = z.object({
  params: z.object({ caseId: z.string().uuid() }),
  body: z.object({ reason: z.string().trim().min(3).max(1000) }),
});

export const submitAppealSchema = z.object({
  params: z.object({ caseId: z.string().uuid() }),
  body: z.object({ statement: z.string().trim().min(10).max(2000) }),
});

export const resolveAppealSchema = z.object({
  params: z.object({ appealId: z.string().uuid() }),
  body: z.object({
    decision: z.enum(['UPHELD', 'OVERTURNED']),
    resolutionNote: z.string().trim().max(1000).optional(),
  }),
});
