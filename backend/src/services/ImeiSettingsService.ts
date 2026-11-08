import {
  CreateImeiSettingsInput,
  UpdateImeiSettingsInput,
} from '../dto/ImeiSettingsDto';
import { ImeiSettingsRepository } from '../repositories/ImeiSettingsRepository';

export class ImeiSettingsService {
  constructor(private readonly repository = new ImeiSettingsRepository()) {}

  getAll() {
    return this.repository.findAll();
  }

  getActive(): Promise<{ id: number; name: string; servicePrice: number }[]> {
    return this.repository.findActive();
  }

  create(input: CreateImeiSettingsInput, actorId: number) {
    return this.repository.create(input, actorId);
  }

  update(id: number, input: UpdateImeiSettingsInput, actorId: number) {
    return this.repository.update(id, input, actorId);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }

  deleteMany(ids: number[]) {
    return this.repository.deleteMany(ids);
  }
}
