import {
  CreateSettingCoverageInput,
  UpdateSettingCoverageInput,
} from '../dto/SettingCoverageDto';
import {
  CountryOption,
  SettingCoverage,
  SettingCoverageRepository,
} from '../repositories/SettingCoverageRepository';

export class SettingCoverageService {
  constructor(private readonly repository = new SettingCoverageRepository()) {}

  getAll(): Promise<SettingCoverage[]> {
    return this.repository.findAll();
  }

  getActiveCountries(): Promise<CountryOption[]> {
    return this.repository.findActiveCountries();
  }

  create(input: CreateSettingCoverageInput, actorId: number | null): Promise<SettingCoverage> {
    return this.repository.create(input, actorId);
  }

  update(
    id: number,
    input: UpdateSettingCoverageInput,
    actorId: number | null,
  ): Promise<SettingCoverage | null> {
    return this.repository.update(id, input, actorId);
  }

  delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  deleteMany(ids: number[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }
}
