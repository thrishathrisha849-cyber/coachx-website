import { z } from 'zod';

const uuid = () => z.string().uuid();

export const assignCourseToOrgMembersSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({
    userIds: z.array(uuid()).min(1).max(500),
    accessEndAt: z.string().datetime().optional(),
    reason: z.string().trim().max(1000).optional(),
  }),
});

export const orgEnrollmentQuerySchema = z.object({
  query: z.object({ courseId: uuid().optional() }),
});

export const orgEnrollmentIdParamSchema = z.object({ params: z.object({ enrollmentId: uuid() }) });

export const orgRemoveAccessSchema = z.object({
  params: z.object({ enrollmentId: uuid() }),
  body: z.object({ reason: z.string().trim().min(3).max(1000) }),
});

export const orgSetDeadlineSchema = z.object({
  params: z.object({ enrollmentId: uuid() }),
  body: z.object({ accessEndAt: z.string().datetime().nullable() }),
});
