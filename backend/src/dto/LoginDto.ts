import { z } from 'zod';

export interface LoginDto {
  identifier: string;
  password: string;
}

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(1000),
  username: z.string().trim().min(1, 'Username is required.').max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, and hyphens.'),
  password: z.string().min(7, 'Password must be at least 7 characters.').max(100),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
  chatId: z.string().trim().min(1, 'Chat ID is required.').max(100),
  telegramUsername: z.string().trim().min(1, 'Telegram username is required.').max(64)
    .transform((value) => value.replace(/^@/, '')),
  email: z.string().trim().email('Enter a valid email address.').max(500),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

export type RegisterDto = z.infer<typeof registerSchema>;
