import { z } from 'zod';

export const createApiClientSchema = z.object({
  userId: z.coerce.number().int().positive(),
  user: z.string().trim().min(1).max(100),
  type: z.coerce.number().int().positive(),
  status: z.coerce.number().int().refine((value) => value === 0 || value === 1).default(1),
});

export const updateApiClientSchema = z.object({
  status: z.coerce.number().int().refine((value) => value === 0 || value === 1),
});

export const apiClientIdSchema = z.coerce.number().int().positive();

export type CreateApiClientInput = z.infer<typeof createApiClientSchema>;
export type UpdateApiClientInput = z.infer<typeof updateApiClientSchema>;
