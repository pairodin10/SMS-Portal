import { Router } from 'express';
import { SmsController } from '../controllers/SmsController';
import { SmsService } from '../services/SmsService';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const smsService = new SmsService();
const smsController = new SmsController(smsService);

router.use(requireAuth);
router.post('/send', requireRole('super_admin', 'administrator', 'operator'), smsController.sendQuickSms);
router.get('/history', requireRole('super_admin', 'administrator', 'operator', 'viewer'), smsController.getHistory);

export default router;
