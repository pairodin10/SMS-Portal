import { z } from 'zod';

const serverFields = {
  name: z.string().trim().min(1).max(150),
  url: z.string().trim().url().max(255).refine((value) => /^https?:\/\//i.test(value), 'Endpoint must use HTTP or HTTPS.'),
  type: z.string().trim().min(1).max(64),
  status: z.enum(['active', 'disabled']),
  priority: z.coerce.number().int().min(1).max(2147483647),
};

export const createSmsServerSchema = z.object({
  ...serverFields,
  status: serverFields.status.default('active'),
  priority: serverFields.priority.default(1),
});

export const updateSmsServerSchema = z.object({
  name: serverFields.name.optional(),
  url: serverFields.url.optional(),
  type: serverFields.type.optional(),
  status: serverFields.status.optional(),
  priority: serverFields.priority.optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided.');

export type CreateSmsServerInput = z.infer<typeof createSmsServerSchema>;
export type UpdateSmsServerInput = z.infer<typeof updateSmsServerSchema>;
