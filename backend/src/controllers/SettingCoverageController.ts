import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createSettingCoverageSchema,
  settingCoverageIdSchema,
  updateSettingCoverageSchema,
} from '../dto/SettingCoverageDto';
import { bulkDeleteNumericIdsSchema } from '../dto/BulkDeleteDto';
import { SettingCoverageService } from '../services/SettingCoverageService';

export class SettingCoverageController {
  constructor(private readonly service: SettingCoverageService) {}

  list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  };

  listActiveCountries = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getActiveCountries() });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createSettingCoverageSchema.parse(req.body);
      res.status(201).json({
        success: true,
        data: await this.service.create(input, this.actorId(req)),
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.coverageId(req.params.id);
      const input = updateSettingCoverageSchema.parse(req.body);
      const coverage = await this.service.update(id, input, this.actorId(req));
      if (!coverage) {
        res.status(404).json({ success: false, message: 'Country coverage not found.' });
        return;
      }
      res.status(200).json({ success: true, data: coverage });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.coverageId(req.params.id);
      const deleted = await this.service.delete(id);
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'Country coverage deleted.' : 'Country coverage not found.',
      });
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = bulkDeleteNumericIdsSchema.parse(req.body);
      const deletedCount = await this.service.deleteMany(ids);
      res.status(200).json({ success: true, data: { deletedCount } });
    } catch (error) {
      next(error);
    }
  };

  private coverageId(rawId: string | string[]): number {
    return settingCoverageIdSchema.parse(Array.isArray(rawId) ? rawId[0] : rawId);
  }

  private actorId(req: AuthenticatedRequest): number | null {
    const id = Number(req.user?.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
