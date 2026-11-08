export class User {
  constructor(
    private readonly _id: string,
    private _fullName: string,
    private _email: string,
    private _passwordHash: string,
    private _role: string,
    private _status: 'active' | 'inactive' = 'active',
    private _createdAt: Date = new Date(),
    private readonly _username = '',
    private readonly _credits: {
      sms: number;
      whatsapp: number;
      checker: number;
      voice: number;
      email: number;
    } = { sms: 0, whatsapp: 0, checker: 0, voice: 0, email: 0 },
    private readonly _chatId: string | null = null,
    private readonly _telegramUsername: string | null = null,
  ) {}

  get id(): string {
    return this._id;
  }

  get fullName(): string {
    return this._fullName;
  }

  get email(): string {
    return this._email;
  }

  get username(): string {
    return this._username;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): string {
    return this._role;
  }

  get status(): 'active' | 'inactive' {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get chatId(): string | null {
    return this._chatId;
  }

  get telegramUsername(): string | null {
    return this._telegramUsername;
  }

  setPasswordHash(passwordHash: string): void {
    this._passwordHash = passwordHash;
  }

  toJSON() {
    return {
      id: this._id,
      fullName: this._fullName,
      username: this._username,
      email: this._email,
      role: this._role,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      credits: this._credits,
      chatId: this._chatId,
      telegramUsername: this._telegramUsername,
    };
  }
}
