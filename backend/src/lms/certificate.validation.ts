import { z } from 'zod';

const uuid = () => z.string().uuid();

export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
export const certificateIdParamSchema = z.object({ params: z.object({ certificateId: uuid() }) });
export const credentialIdParamSchema = z.object({ params: z.object({ credentialId: z.string().trim().min(1).max(40) }) });

export const revokeCertificateSchema = z.object({
  params: z.object({ certificateId: uuid() }),
  body: z.object({ reason: z.string().trim().min(3).max(1000) }),
});

// ============================================================================
// Admin: Certificate Templates
// ============================================================================

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200),
    backgroundUrl: z.string().url().max(500).optional(),
    logoUrl: z.string().url().max(500).optional(),
    signatureUrl: z.string().url().max(500).optional(),
    sealUrl: z.string().url().max(500).optional(),
    fontFamily: z.string().max(100).optional(),
    primaryColor: z.string().max(20).optional(),
    language: z.string().max(10).default('EN'),
  }),
});

export const templateIdParamSchema = z.object({ params: z.object({ templateId: uuid() }) });

export const updateTemplateSchema = z.object({
  params: z.object({ templateId: uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(200),
      backgroundUrl: z.string().url().max(500).nullable(),
      logoUrl: z.string().url().max(500).nullable(),
      signatureUrl: z.string().url().max(500).nullable(),
      sealUrl: z.string().url().max(500).nullable(),
      fontFamily: z.string().max(100).nullable(),
      primaryColor: z.string().max(20).nullable(),
      language: z.string().max(10),
      isActive: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Request body must not be empty' }),
});

export const mapCourseTemplateSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({ templateId: uuid().nullable() }),
});
