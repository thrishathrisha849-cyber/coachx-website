import { z } from 'zod';

const uuid = () => z.string().uuid();

export const bulkImportSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    csvContent: z.string().trim().min(1).max(2 * 1024 * 1024),
  }),
});
