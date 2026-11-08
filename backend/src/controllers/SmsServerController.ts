import { NextFunction, Request, Response } from 'express';
import { createSmsServerSchema, updateSmsServerSchema } from '../dto/SmsServerDto';
import { SmsServerService } from '../services/SmsServerService';

export class SmsServerController {
  constructor(private readonly service: SmsServerService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createSmsServerSchema.parse(req.body);
      res.status(201).json({ success: true, data: await this.service.create(input) });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const input = updateSmsServerSchema.parse(req.body);
      const server = await this.service.update(id, input);
      if (!server) {
        res.status(404).json({ success: false, message: 'SMS server not found.' });
        return;
      }
      res.status(200).json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await this.service.delete(id);
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'SMS server deleted.' : 'SMS server not found.',
      });
    } catch (error) {
      next(error);
    }
  };
}
