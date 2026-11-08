import { z } from 'zod';

const gatewayFields = {
  name: z.string().trim().min(1).max(200),
  apiLink: z.string().trim().min(1).max(500).refine(
    (value) => /^https?:\/\//i.test(value),
    'API link must use HTTP or HTTPS.',
  ),
  sourceParam: z.string().trim().min(1).max(100),
  sourceValue: z.string().trim().max(200).nullable().optional(),
  destinationParam: z.string().trim().min(1).max(100),
  messageParam: z.string().trim().min(1).max(100),
  unicodeParam: z.string().trim().max(100).nullable().optional(),
  unicodeValue: z.string().trim().max(200).nullable().optional(),
  successKeyword: z.string().trim().max(100).nullable().optional(),
  status: z.coerce.number().int().min(0).max(1),
};

const gatewayParameterSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1).max(200),
  value: z.string().max(65535).optional(),
  status: z.coerce.number().int().min(0).max(1).default(1),
});

export const createAllanGatewaySchema = z.object({
  ...gatewayFields,
  gatewayParams: z.array(gatewayParameterSchema).max(100).default([]),
  sourceValue: gatewayFields.sourceValue.default(null),
  unicodeParam: gatewayFields.unicodeParam.default(null),
  unicodeValue: gatewayFields.unicodeValue.default(null),
  successKeyword: gatewayFields.successKeyword.default(null),
  status: gatewayFields.status.default(1),
});

export const allanGatewayIdSchema = z.coerce.number().int().min(1).max(65535);

export const updateAllanGatewaySchema = z.object({
  name: gatewayFields.name.optional(),
  apiLink: gatewayFields.apiLink.optional(),
  sourceParam: gatewayFields.sourceParam.optional(),
  sourceValue: gatewayFields.sourceValue,
  destinationParam: gatewayFields.destinationParam.optional(),
  messageParam: gatewayFields.messageParam.optional(),
  unicodeParam: gatewayFields.unicodeParam,
  unicodeValue: gatewayFields.unicodeValue,
  successKeyword: gatewayFields.successKeyword,
  status: gatewayFields.status.optional(),
  gatewayParams: z.array(gatewayParameterSchema).max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided.');

export type CreateAllanGatewayInput = z.infer<typeof createAllanGatewaySchema>;
export type UpdateAllanGatewayInput = z.infer<typeof updateAllanGatewaySchema>;
export type GatewayParameterInput = z.infer<typeof gatewayParameterSchema>;
