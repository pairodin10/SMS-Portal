import { z } from 'zod';

export const smsSendSchema = z.object({
  to: z.string().trim().min(8, 'Recipient phone number is required').regex(/^\+?[0-9\s\-()]{8,20}$/, 'Enter a valid phone number'),
  senderId: z.string().trim().min(2, 'Sender ID is required').max(11),
  body: z.string().trim().min(1, 'Message is required').max(1600, 'Message exceeds the supported length'),
  category: z.string().trim().min(2).max(50).optional().default('general'),
  country: z.string().trim().min(2).max(60).optional(),
  providerType: z.enum(['custom', 'twilio']).optional().default('custom'),
});

export type SmsSendInput = z.infer<typeof smsSendSchema>;
