import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { DashboardService } from '../services/DashboardService';
import { requireAuth } from '../middleware/auth';

const router = Router();
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

router.use(requireAuth);
router.get('/overview', dashboardController.getOverview);
router.get('/analytics', dashboardController.getAnalytics);
router.get('/announcement', dashboardController.getLatestAnnouncement);
router.get('/metrics', dashboardController.getMetrics);
router.get('/activity', dashboardController.getActivity);

export default router;
