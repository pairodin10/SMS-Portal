import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  allanGatewayIdSchema,
  createAllanGatewaySchema,
  updateAllanGatewaySchema,
} from '../dto/AllanGatewayDto';
import { bulkDeleteNumericIdsSchema } from '../dto/BulkDeleteDto';
import { AllanGatewayService } from '../services/AllanGatewayService';

export class AllanGatewayController {
  constructor(private readonly service: AllanGatewayService) {}

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
      const input = createAllanGatewaySchema.parse(req.body);
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
      const id = this.gatewayId(req.params.id);
      const input = updateAllanGatewaySchema.parse(req.body);
      const gateway = await this.service.update(id, input, this.actorId(req));
      if (!gateway) {
        res.status(404).json({ success: false, message: 'Gateway not found.' });
        return;
      }
      res.status(200).json({ success: true, data: gateway });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.gatewayId(req.params.id);
      const deleted = await this.service.delete(id);
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'Gateway deleted.' : 'Gateway not found.',
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

  private gatewayId(rawId: string | string[]): number {
    const value = Array.isArray(rawId) ? rawId[0] : rawId;
    return allanGatewayIdSchema.parse(value);
  }

  private actorId(req: AuthenticatedRequest): number | null {
    const id = Number(req.user?.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
