import { z } from 'zod';

const uuid = () => z.string().uuid();
const paginationQuery = z.object({ page: z.string().optional(), pageSize: z.string().optional() });

/**
 * Learner self-enrollment — deliberately accepts ONLY `courseId`. The
 * source is always resolved server-side to `FREE` (see
 * `enrollment.service.ts`'s `selfEnroll`) — a learner can never request
 * `ADMIN_GRANT`/`MEMBERSHIP`/`PURCHASE`/etc. for themselves, closing the
 * "learner supplies their own privileged enrollment source" escalation
 * path explicitly called out by Part 2C's security review.
 */
export const selfEnrollSchema = z.object({
  body: z.object({ courseId: uuid() }),
});

export const ADMIN_ENROLLMENT_SOURCES = [
  'FREE',
  'MEMBERSHIP',
  'PURCHASE',
  'PROGRAM',
  'ORGANIZATION',
  'ADMIN_GRANT',
  'COUPON',
  'SCHOLARSHIP',
  'TRIAL',
  'INVITE',
] as const;

export const adminCreateEnrollmentSchema = z.object({
  body: z.object({
    userId: uuid(),
    courseId: uuid(),
    source: z.enum(ADMIN_ENROLLMENT_SOURCES).default('ADMIN_GRANT'),
    accessStartAt: z.string().datetime().optional(),
    accessEndAt: z.string().datetime().optional(),
    reason: z.string().trim().max(1000).optional(),
  }),
});

export const enrollmentIdParamSchema = z.object({ params: z.object({ id: uuid() }) });

export const adminEnrollmentQuerySchema = z.object({
  query: paginationQuery.extend({
    courseId: uuid().optional(),
    userId: uuid().optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'REVOKED']).optional(),
  }),
});

export const extendAccessSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({ accessEndAt: z.string().datetime().nullable() }),
});

const reasonBody = z.object({ reason: z.string().trim().min(3).max(1000) });

export const suspendEnrollmentSchema = z.object({ params: z.object({ id: uuid() }), body: reasonBody });
export const revokeEnrollmentSchema = z.object({ params: z.object({ id: uuid() }), body: reasonBody });
export const reactivateEnrollmentSchema = z.object({ params: z.object({ id: uuid() }), body: z.object({ reason: z.string().trim().max(1000).optional() }) });

export const resetProgressSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    scope: z.enum(['LESSON', 'MODULE', 'COURSE']),
    targetId: uuid(),
    reason: z.string().trim().min(3).max(1000),
  }),
});

export const overrideCompleteSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    scope: z.enum(['LESSON', 'MODULE', 'COURSE']),
    targetId: uuid(),
    reason: z.string().trim().min(3).max(1000),
  }),
});

export const courseIdQueryParamSchema = z.object({ params: z.object({ courseId: uuid() }) });

/** Instructor-scoped override — `:id` in the route is the COURSE id (ownership-checked); `enrollmentId` is supplied in the body since the target enrollment belongs to a learner, not the instructor's own course path segment. */
export const instructorOverrideCompleteSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    enrollmentId: uuid(),
    scope: z.enum(['LESSON', 'MODULE']),
    targetId: uuid(),
    reason: z.string().trim().min(3).max(1000),
  }),
});
