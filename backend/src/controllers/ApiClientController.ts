import { NextFunction, Response } from 'express';
import { apiClientIdSchema, createApiClientSchema, updateApiClientSchema } from '../dto/ApiClientDto';
import { bulkDeleteNumericIdsSchema } from '../dto/BulkDeleteDto';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiClientService } from '../services/ApiClientService';

export class ApiClientController {
  constructor(private readonly service: ApiClientService) {}

  list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createApiClientSchema.parse(req.body);
      const actorId = this.actorId(req, res);
      if (actorId === null) return;
      res.status(201).json({ success: true, data: await this.service.create(input, actorId) });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = apiClientIdSchema.parse(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const input = updateApiClientSchema.parse(req.body);
      const actorId = this.actorId(req, res);
      if (actorId === null) return;
      const client = await this.service.update(id, input, actorId);
      if (!client) {
        res.status(404).json({ success: false, message: 'API client not found.' });
        return;
      }
      res.status(200).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = apiClientIdSchema.parse(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const deleted = await this.service.delete(id);
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'API client deleted.' : 'API client not found.',
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

  private actorId(req: AuthenticatedRequest, res: Response): number | null {
    const id = Number(req.user?.sub);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ success: false, message: 'A valid numeric account ID is required for this change.' });
      return null;
    }
    return id;
  }
}
