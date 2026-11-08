import { NextFunction, Request, Response } from 'express';
import { SmsService } from '../services/SmsService';

export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  sendQuickSms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.smsService.send(req.body, req.body.providerType || 'custom');
      res.status(result.success ? 200 : 400).json({
        success: result.success,
        data: result,
        message: result.success ? 'SMS queued successfully. No real delivery was performed because no live gateway is configured.' : result.error || 'SMS could not be processed.',
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.smsService.getHistory();
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };
}
