import { randomUUID } from 'crypto';
import { CreateSmsServerInput, UpdateSmsServerInput } from '../dto/SmsServerDto';
import { SmsServer, SmsServerRepository } from '../repositories/SmsServerRepository';

export class SmsServerService {
  constructor(private readonly repository = new SmsServerRepository()) {}

  getAll(): Promise<SmsServer[]> {
    return this.repository.findAll();
  }

  create(input: CreateSmsServerInput): Promise<SmsServer> {
    return this.repository.create({ ...input, id: randomUUID() });
  }

  update(id: string, input: UpdateSmsServerInput): Promise<SmsServer | null> {
    return this.repository.update(id, input);
  }

  delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
