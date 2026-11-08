export interface SmsMessagePayload {
  to: string;
  senderId: string;
  body: string;
  category?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  creditsUsed?: number;
}

export interface ISmsProvider {
  name: string;
  send(payload: SmsMessagePayload): Promise<SmsSendResult>;
}

export abstract class AbstractSmsProvider implements ISmsProvider {
  abstract readonly name: string;

  protected estimateCredits(body: string): number {
    return Math.max(1, Math.ceil(body.length / 160));
  }

  abstract send(payload: SmsMessagePayload): Promise<SmsSendResult>;
}
