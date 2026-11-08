import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await this.dashboardService.getOverview();
      res.status(200).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await this.dashboardService.getAnalytics();
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  };

  getLatestAnnouncement = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const announcement = await this.dashboardService.getLatestAnnouncement();
      res.status(200).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  };

  getMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: await this.dashboardService.getMetrics(req.user.sub) });
    } catch (error) {
      next(error);
    }
  };

  getActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: await this.dashboardService.getActivity(req.user.sub) });
    } catch (error) {
      next(error);
    }
  };
}
