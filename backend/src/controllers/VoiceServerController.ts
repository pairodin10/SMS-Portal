import { NextFunction, Response } from 'express';
import { bulkDeleteNumericIdsSchema } from '../dto/BulkDeleteDto';
import {
  createVoiceServerSchema,
  updateVoiceServerSchema,
  voiceServerIdSchema,
} from '../dto/VoiceServerDto';
import { AuthenticatedRequest } from '../middleware/auth';
import { VoiceServerService } from '../services/VoiceServerService';

export class VoiceServerController {
  constructor(private readonly service: VoiceServerService) {}

  list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createVoiceServerSchema.parse(req.body);
      res.status(201).json({ success: true, data: await this.service.create(input, this.actorId(req)) });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const server = await this.service.update(
        this.serverId(req.params.id),
        updateVoiceServerSchema.parse(req.body),
        this.actorId(req),
      );
      if (!server) {
        res.status(404).json({ success: false, message: 'Voice server not found.' });
        return;
      }
      res.status(200).json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.service.delete(this.serverId(req.params.id));
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'Voice server deleted.' : 'Voice server not found.',
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

  private serverId(rawId: string | string[]): number {
    return voiceServerIdSchema.parse(Array.isArray(rawId) ? rawId[0] : rawId);
  }

  private actorId(req: AuthenticatedRequest): number {
    const id = Number(req.user?.sub);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Authenticated account ID is invalid.');
    return id;
  }
}
