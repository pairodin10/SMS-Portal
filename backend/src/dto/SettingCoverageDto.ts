import { z } from 'zod';

const coverageFields = {
  countryName: z.string().trim().min(1).max(30),
  regionCode: z.string().trim().max(10).nullable().optional(),
  isoCode: z.string().trim().max(20).nullable().optional(),
  countryCode: z.string().trim().max(5).nullable().optional(),
  plainTariff: z.coerce.number().finite().min(0).max(999.99),
  voiceTariff: z.coerce.number().finite().min(0).max(999999999999999999.99),
  command: z.string().trim().min(1).max(100),
  description: z.string().nullable().optional(),
  status: z.coerce.number().int().min(0).max(1),
};

export const createSettingCoverageSchema = z.object({
  ...coverageFields,
  regionCode: coverageFields.regionCode.default(null),
  isoCode: coverageFields.isoCode.default(null),
  countryCode: coverageFields.countryCode.default(null),
  description: coverageFields.description.default(null),
  status: coverageFields.status.default(1),
});

export const updateSettingCoverageSchema = z.object({
  countryName: coverageFields.countryName.optional(),
  regionCode: coverageFields.regionCode,
  isoCode: coverageFields.isoCode,
  countryCode: coverageFields.countryCode,
  plainTariff: coverageFields.plainTariff.optional(),
  voiceTariff: coverageFields.voiceTariff.optional(),
  command: coverageFields.command.optional(),
  description: coverageFields.description,
  status: coverageFields.status.optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided.');

export const settingCoverageIdSchema = z.coerce.number().int().min(1).max(4294967295);

export type CreateSettingCoverageInput = z.infer<typeof createSettingCoverageSchema>;
export type UpdateSettingCoverageInput = z.infer<typeof updateSettingCoverageSchema>;
