import { NextFunction, Response } from 'express';
import { bulkDeleteNumericIdsSchema } from '../dto/BulkDeleteDto';
import {
  createImeiSettingsSchema,
  imeiSettingsIdSchema,
  updateImeiSettingsSchema,
} from '../dto/ImeiSettingsDto';
import { AuthenticatedRequest } from '../middleware/auth';
import { ImeiSettingsService } from '../services/ImeiSettingsService';

export class ImeiSettingsController {
  constructor(private readonly service: ImeiSettingsService) {}

  list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  };

  listActive = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getActive() });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createImeiSettingsSchema.parse(req.body);
      res.status(201).json({ success: true, data: await this.service.create(input, this.actorId(req)) });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const setting = await this.service.update(
        this.settingId(req.params.id),
        updateImeiSettingsSchema.parse(req.body),
        this.actorId(req),
      );
      if (!setting) {
        res.status(404).json({ success: false, message: 'IMEI setting not found.' });
        return;
      }
      res.status(200).json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.service.delete(this.settingId(req.params.id));
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'IMEI setting deleted.' : 'IMEI setting not found.',
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

  private settingId(rawId: string | string[]): number {
    return imeiSettingsIdSchema.parse(Array.isArray(rawId) ? rawId[0] : rawId);
  }

  private actorId(req: AuthenticatedRequest): number {
    const id = Number(req.user?.sub);
    if (!Number.isInteger(id) || id < 1) throw new Error('Authenticated account ID is invalid.');
    return id;
  }
}
