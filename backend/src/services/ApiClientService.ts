import { randomBytes } from 'crypto';
import { CreateApiClientInput, UpdateApiClientInput } from '../dto/ApiClientDto';
import { ApiClient, ApiClientRepository } from '../repositories/ApiClientRepository';

export class ApiClientService {
  constructor(private readonly repository = new ApiClientRepository()) {}

  getAll(): Promise<ApiClient[]> {
    return this.repository.findAll();
  }

  async create(input: CreateApiClientInput, actorId: number): Promise<{ client: ApiClient; apiKey: string }> {
    const apiKey = randomBytes(20).toString('hex');
    const client = await this.repository.create({
      userId: input.userId,
      user: input.user,
      type: input.type,
      apiKey,
      status: input.status,
      actorId,
    });
    return { client, apiKey };
  }

  update(id: number, input: UpdateApiClientInput, actorId: number): Promise<ApiClient | null> {
    return this.repository.update(id, input.status, actorId);
  }

  delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  deleteMany(ids: number[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }
}
