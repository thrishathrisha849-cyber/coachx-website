import { z } from 'zod';

const uuid = () => z.string().uuid();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 004 US8 Course Cloning batch — FR-098's six named modes. `ASSESSMENT_BANK` is accepted here (so the request is validation-valid) and rejected with a clear explanation at the service layer — see course-clone.service.ts. */
export const COURSE_CLONE_MODES = ['FULL', 'CURRICULUM_ONLY', 'CONTENT_WITHOUT_ENROLLMENTS', 'ASSESSMENT_BANK', 'CERTIFICATE_SETTINGS', 'TRANSLATION_VARIANT'] as const;

export const cloneCourseSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    mode: z.enum(COURSE_CLONE_MODES),
    slug: z.string().regex(slugPattern, 'Invalid slug format').max(220),
    title: z.string().trim().min(3).max(200).optional(),
    language: z.enum(['EN', 'TA', 'TANGLISH']).optional(),
  }),
});
