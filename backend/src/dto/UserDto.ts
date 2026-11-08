import { z } from 'zod';

const userFields = {
  fullName: z.string().trim().min(1, 'Name is required.').max(1000),
  username: z.string().trim().min(1, 'Username is required.').max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, and hyphens.'),
  email: z.string().trim().email('Enter a valid email address.').max(500),
  role: z.enum(['viewer', 'reseller', 'administrator']),
  status: z.enum(['active', 'inactive']),
};

export const createUserSchema = z.object({
  ...userFields,
  password: z.string().min(7, 'Password must be at least 7 characters.').max(100),
});

export const updateUserSchema = z.object({
  fullName: userFields.fullName.optional(),
  username: userFields.username.optional(),
  email: userFields.email.optional(),
  role: userFields.role.optional(),
  status: userFields.status.optional(),
  password: z.string().min(7, 'Password must be at least 7 characters.').max(100).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), 'At least one field must be provided.');

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
