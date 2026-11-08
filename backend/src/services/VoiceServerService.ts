import { VoiceServer, VoiceServerRepository } from '../repositories/VoiceServerRepository';
import { CreateVoiceServerInput, UpdateVoiceServerInput } from '../dto/VoiceServerDto';

export class VoiceServerService {
  constructor(private readonly repository = new VoiceServerRepository()) {}

  getAll(): Promise<VoiceServer[]> {
    return this.repository.findAll();
  }

  create(input: CreateVoiceServerInput, actorId: number): Promise<VoiceServer> {
    return this.repository.create(input, actorId);
  }

  update(id: number, input: UpdateVoiceServerInput, actorId: number): Promise<VoiceServer | null> {
    return this.repository.update(id, input, actorId);
  }

  delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  deleteMany(ids: number[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }
}
