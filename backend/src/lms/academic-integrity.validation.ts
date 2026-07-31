import { z } from 'zod';
import { ACADEMIC_INTEGRITY_CASE_TYPES, ACADEMIC_INTEGRITY_TARGET_TYPES } from './academic-integrity.types';

const uuid = () => z.string().uuid();

export const flagForInvestigationSchema = z.object({
  body: z.object({
    type: z.enum(ACADEMIC_INTEGRITY_CASE_TYPES),
    targetType: z.enum(ACADEMIC_INTEGRITY_TARGET_TYPES),
    targetId: uuid(),
    reason: z.string().trim().min(10).max(2000),
    evidence: z.unknown().optional(),
  }),
});

export const listAcademicIntegrityCasesQuerySchema = z.object({
  query: z.object({
    status: z.enum(['OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const academicIntegrityCaseIdParamSchema = z.object({ params: z.object({ caseId: uuid() }) });

export const resolveInvestigationSchema = z.object({
  params: z.object({ caseId: uuid() }),
  body: z.object({
    outcome: z.enum(['CONFIRMED', 'CLEARED']),
    reason: z.string().trim().min(3).max(2000),
  }),
});

export const resolveIntegrityAppealSchema = z.object({
  params: z.object({ appealId: uuid() }),
  body: z.object({
    decision: z.enum(['UPHELD', 'OVERTURNED']),
    resolutionNote: z.string().trim().max(2000).optional(),
  }),
});
