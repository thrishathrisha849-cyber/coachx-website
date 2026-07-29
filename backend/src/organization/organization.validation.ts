import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 001 FR-053/FR-086: creating an Organization (Organization-tier catalog entity). */
export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200),
    slug: z.string().regex(slugPattern, 'Invalid slug format').max(220),
  }),
});

export const updateOrganizationSchema = z.object({
  params: z.object({ organizationId: z.string().uuid() }),
  body: z.object({
    name: z.string().trim().min(2).max(200).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
  }),
});

export const organizationIdParamSchema = z.object({
  params: z.object({ organizationId: z.string().uuid() }),
});

export const assignMemberSchema = z.object({
  params: z.object({ organizationId: z.string().uuid() }),
  body: z.object({ userId: z.string().uuid() }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
