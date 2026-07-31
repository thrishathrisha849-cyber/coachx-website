import { z } from 'zod';

const uuid = () => z.string().uuid();

export const COHORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const;

export const createCohortSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({
    name: z.string().trim().min(2).max(200),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().nullable().optional(),
    timezone: z.string().trim().min(1).max(64),
    capacity: z.number().int().min(1).max(1_000_000).nullable().optional(),
  }),
});

export const updateCohortSchema = z.object({
  params: z.object({ cohortId: uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(200),
      startDate: z.string().datetime(),
      endDate: z.string().datetime().nullable(),
      timezone: z.string().trim().min(1).max(64),
      capacity: z.number().int().min(1).max(1_000_000).nullable(),
      status: z.enum(COHORT_STATUSES),
    })
    .partial()
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const cohortIdParamSchema = z.object({ params: z.object({ cohortId: uuid() }) });
export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });

export const addCohortMemberSchema = z.object({
  params: z.object({ cohortId: uuid() }),
  body: z.object({ userId: uuid() }),
});

export const cohortMemberIdParamSchema = z.object({
  params: z.object({ cohortId: uuid(), memberId: uuid() }),
});

export const setCohortModuleScheduleSchema = z.object({
  params: z.object({ cohortId: uuid(), moduleId: uuid() }),
  body: z.object({ unlockAt: z.string().datetime() }),
});

export const cohortModuleParamSchema = z.object({
  params: z.object({ cohortId: uuid(), moduleId: uuid() }),
});
