import { z } from 'zod';
import { SmsProviderFactory } from '../factories/SmsProviderFactory';
import { SmsMessagePayload, SmsSendResult } from '../interfaces/ISmsProvider';
import { SmsMessage } from '../models/SmsMessage';
import { SmsRepository } from '../repositories/SmsRepository';
import { smsSendSchema } from '../dto/SmsDto';

export class SmsService {
  constructor(private readonly smsRepository = new SmsRepository()) {}

  async send(payload: SmsMessagePayload & { country?: string; providerType?: string }, providerTypeOverride?: string): Promise<SmsSendResult> {
    const providerType = providerTypeOverride ?? payload.providerType ?? 'custom';
    const validatedPayload = smsSendSchema.parse({
      to: payload.to,
      senderId: payload.senderId ?? 'SMSPORTAL',
      body: payload.body,
      category: payload.category,
      country: payload.country,
      providerType,
    });

    const provider = SmsProviderFactory.create(validatedPayload.providerType);
    const result = await provider.send({
      to: validatedPayload.to,
      senderId: validatedPayload.senderId,
      body: validatedPayload.body,
      category: validatedPayload.category,
    });

    if (result.success) {
      const message = new SmsMessage(
        `sms_${Date.now()}`,
        'system-user',
        validatedPayload.to,
        validatedPayload.body,
        validatedPayload.category,
        validatedPayload.country ?? 'NG',
        'sent',
        undefined,
        provider.name,
        result.creditsUsed || 1,
      );

      await this.smsRepository.create(message);
    }

    return result;
  }

  async getHistory() {
    return (await this.smsRepository.findAll()).map((message) => message.toJSON());
  }

  estimateCredits(message: string): number {
    return Math.max(1, Math.ceil(message.trim().length / 160));
  }
}
