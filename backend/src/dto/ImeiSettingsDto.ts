import { z } from 'zod';

const imeiSettingsFields = {
  name: z.string().trim().min(1).max(100),
  service: z.string().trim().min(1).max(100),
  serviceValue: z.coerce.number().int().min(0).max(2147483647),
  servicePrice: z.coerce.number().finite().min(0).max(999999999999999999.99),
  status: z.coerce.number().int().min(0).max(1),
};

export const createImeiSettingsSchema = z.object({
  ...imeiSettingsFields,
  status: imeiSettingsFields.status.default(1),
});

export const updateImeiSettingsSchema = z.object({
  name: imeiSettingsFields.name.optional(),
  service: imeiSettingsFields.service.optional(),
  serviceValue: imeiSettingsFields.serviceValue.optional(),
  servicePrice: imeiSettingsFields.servicePrice.optional(),
  status: imeiSettingsFields.status.optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided.');

export const imeiSettingsIdSchema = z.coerce.number().int().min(1).max(2147483647);

export type CreateImeiSettingsInput = z.infer<typeof createImeiSettingsSchema>;
export type UpdateImeiSettingsInput = z.infer<typeof updateImeiSettingsSchema>;
