import { z } from 'zod';

const uuid = () => z.string().uuid();

/** 004 Project-based Learning batch (FR-077) — reuses `CourseModuleStatus`'s exact DRAFT/PUBLISHED/ARCHIVED value set (`Project.status` is typed against that same Prisma enum). */
export const PROJECT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export const moduleIdParamSchema = z.object({ params: z.object({ moduleId: uuid() }) });
export const projectIdParamSchema = z.object({ params: z.object({ projectId: uuid() }) });

export const createProjectSchema = z.object({
  params: z.object({ moduleId: uuid() }),
  body: z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().max(20000).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ projectId: uuid() }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200),
      description: z.string().max(20000).nullable(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const changeProjectStatusSchema = z.object({
  params: z.object({ projectId: uuid() }),
  body: z.object({ status: z.enum(PROJECT_STATUSES) }),
});

export const linkArtifactSchema = z.object({
  params: z.object({ projectId: uuid() }),
  body: z.object({ assignmentId: uuid() }),
});

export const unlinkArtifactSchema = z.object({
  params: z.object({ projectId: uuid(), assignmentId: uuid() }),
});
