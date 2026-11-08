import { z } from 'zod';

const voiceServerFields = {
  name: z.string().trim().min(1).max(100),
  sid: z.string().trim().min(1).max(100),
  token: z.string().trim().min(1).max(100),
  phoneNumber: z.string().trim().min(1).max(50),
  status: z.coerce.number().int().min(0).max(1),
};

export const createVoiceServerSchema = z.object({
  ...voiceServerFields,
  status: voiceServerFields.status.default(1),
});

export const updateVoiceServerSchema = z.object({
  name: voiceServerFields.name.optional(),
  sid: z.string().trim().min(1).max(100).optional(),
  token: z.string().trim().min(1).max(100).optional(),
  phoneNumber: voiceServerFields.phoneNumber.optional(),
  status: voiceServerFields.status.optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided.');

export const voiceServerIdSchema = z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER);

export type CreateVoiceServerInput = z.infer<typeof createVoiceServerSchema>;
export type UpdateVoiceServerInput = z.infer<typeof updateVoiceServerSchema>;
