export type SmsStatus = 'queued' | 'sent' | 'failed' | 'pending';

export class SmsMessage {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _recipientPhone: string,
    private _body: string,
    private readonly _category: string,
    private readonly _countryCode: string,
    private _status: SmsStatus = 'queued',
    private readonly _serverId?: string,
    private readonly _providerName?: string,
    private _creditsUsed = 0,
    private readonly _createdAt: Date = new Date(),
  ) {}

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get recipientPhone(): string { return this._recipientPhone; }
  get body(): string { return this._body; }
  get category(): string { return this._category; }
  get countryCode(): string { return this._countryCode; }
  get status(): SmsStatus { return this._status; }
  get serverId(): string | undefined { return this._serverId; }
  get providerName(): string | undefined { return this._providerName; }
  get creditsUsed(): number { return this._creditsUsed; }
  get createdAt(): Date { return this._createdAt; }

  setStatus(status: SmsStatus): void {
    this._status = status;
  }

  setBody(body: string): void {
    this._body = body;
  }

  setCreditsUsed(creditsUsed: number): void {
    this._creditsUsed = creditsUsed;
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      recipientPhone: this._recipientPhone,
      body: this._body,
      category: this._category,
      countryCode: this._countryCode,
      status: this._status,
      serverId: this._serverId,
      providerName: this._providerName,
      creditsUsed: this._creditsUsed,
      createdAt: this._createdAt.toISOString(),
    };
  }
}
