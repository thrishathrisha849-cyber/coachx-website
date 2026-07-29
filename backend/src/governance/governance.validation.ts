import { z } from 'zod';

const PHASE_VALUES = ['FOUNDATION_MVP', 'GROWTH_PLATFORM', 'BUSINESS_OPERATING_SYSTEM', 'ENTERPRISE_ECOSYSTEM'] as const;

export const startGovernanceRecordSchema = z.object({
  body: z.object({
    featureName: z.string().trim().min(2).max(200),
    phase: z.enum(PHASE_VALUES),
  }),
});

export const governanceIdParamSchema = z.object({
  params: z.object({ recordId: z.string().uuid() }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const mvpScopeCheckSchema = z.object({
  body: z.object({ capabilityCode: z.string().trim().min(2).max(120) }),
});

export const phaseGateQuerySchema = z.object({
  params: z.object({ phase: z.enum(PHASE_VALUES) }),
});
