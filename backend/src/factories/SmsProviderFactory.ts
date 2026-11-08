import { AbstractSmsProvider, ISmsProvider, SmsMessagePayload, SmsSendResult } from '../interfaces/ISmsProvider';

class TwilioSmsProvider extends AbstractSmsProvider {
  readonly name = 'twilio';

  async send(payload: SmsMessagePayload): Promise<SmsSendResult> {
    const creditsUsed = this.estimateCredits(payload.body);
    return {
      success: true,
      provider: this.name,
      messageId: 'mock-twilio-message-id',
      creditsUsed,
    };
  }
}

class CustomSmsProvider extends AbstractSmsProvider {
  readonly name = 'custom';

  async send(payload: SmsMessagePayload): Promise<SmsSendResult> {
    const creditsUsed = this.estimateCredits(payload.body);
    return {
      success: true,
      provider: this.name,
      messageId: `mock-${payload.to}`.replace(/\D/g, '').slice(-12),
      creditsUsed,
    };
  }
}

export class SmsProviderFactory {
  static create(providerType: string): ISmsProvider {
    switch (providerType) {
      case 'twilio':
        return new TwilioSmsProvider();
      case 'custom':
      default:
        return new CustomSmsProvider();
    }
  }
}
