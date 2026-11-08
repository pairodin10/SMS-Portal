import { SmsMessage } from '../models/SmsMessage';

export interface ISmsRepository {
  create(message: SmsMessage): Promise<SmsMessage>;
  findAll(): Promise<SmsMessage[]>;
  findByUserId(userId: string): Promise<SmsMessage[]>;
  findById(id: string): Promise<SmsMessage | null>;
}

export class SmsRepository implements ISmsRepository {
  private readonly messages: SmsMessage[] = [];

  async create(message: SmsMessage): Promise<SmsMessage> {
    this.messages.push(message);
    return message;
  }

  async findAll(): Promise<SmsMessage[]> {
    return [...this.messages];
  }

  async findByUserId(userId: string): Promise<SmsMessage[]> {
    return this.messages.filter((message) => message.userId === userId);
  }

  async findById(id: string): Promise<SmsMessage | null> {
    return this.messages.find((message) => message.id === id) ?? null;
  }
}
