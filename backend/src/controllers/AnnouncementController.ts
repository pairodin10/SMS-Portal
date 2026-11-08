import { NextFunction, Response } from 'express';
import { announcementIdSchema, createAnnouncementSchema, updateAnnouncementSchema } from '../dto/AnnouncementDto';
import { bulkDeleteNumericIdsSchema } from '../dto/BulkDeleteDto';
import { AuthenticatedRequest } from '../middleware/auth';
import { AnnouncementService } from '../services/AnnouncementService';

export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.id(req.params.id);
      const announcement = await this.service.getById(id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found.' });
        return;
      }
      res.status(200).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = this.actorId(req, res);
      if (actorId === null) return;
      const input = createAnnouncementSchema.parse(req.body);
      res.status(201).json({ success: true, data: await this.service.create(input, actorId) });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = this.actorId(req, res);
      if (actorId === null) return;
      const input = updateAnnouncementSchema.parse(req.body);
      const announcement = await this.service.update(this.id(req.params.id), input, actorId);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found.' });
        return;
      }
      res.status(200).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.service.delete(this.id(req.params.id));
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'Announcement deleted.' : 'Announcement not found.',
      });
    } catch (error) {
      next(error);
    }
  };

  bulkDelete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = bulkDeleteNumericIdsSchema.parse(req.body);
      res.status(200).json({ success: true, data: { deletedCount: await this.service.deleteMany(ids) } });
    } catch (error) {
      next(error);
    }
  };

  private id(rawId: string | string[]): number {
    return announcementIdSchema.parse(Array.isArray(rawId) ? rawId[0] : rawId);
  }

  private actorId(req: AuthenticatedRequest, res: Response): number | null {
    const id = Number(req.user?.sub);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ success: false, message: 'A valid numeric account ID is required for this change.' });
      return null;
    }
    return id;
  }
}
