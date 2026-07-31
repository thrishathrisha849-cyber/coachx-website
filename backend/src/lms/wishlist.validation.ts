import { z } from 'zod';

const uuid = () => z.string().uuid();

export const courseIdParamSchema = z.object({ params: z.object({ courseId: uuid() }) });
