import { CreateAnnouncementInput, UpdateAnnouncementInput } from '../repositories/AnnouncementRepository';
import { AnnouncementRepository } from '../repositories/AnnouncementRepository';

export class AnnouncementService {
  constructor(private readonly repository = new AnnouncementRepository()) {}

  getAll() {
    return this.repository.findAll();
  }

  getById(id: number) {
    return this.repository.findById(id);
  }

  create(input: CreateAnnouncementInput, actorId: number) {
    return this.repository.create(input, actorId);
  }

  update(id: number, input: UpdateAnnouncementInput, actorId: number) {
    return this.repository.update(id, input, actorId);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }

  deleteMany(ids: number[]) {
    return this.repository.deleteMany(ids);
  }
}
