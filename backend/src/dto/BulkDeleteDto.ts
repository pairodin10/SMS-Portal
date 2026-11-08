import { z } from 'zod';

export const bulkDeleteUserIdsSchema = z.object({
  ids: z.array(z.string().regex(/^\d+$/, 'User IDs must be numeric.')).min(1).max(500),
});

export const bulkDeleteNumericIdsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(500),
});

export type BulkDeleteIds = { ids: string[] | number[] };
