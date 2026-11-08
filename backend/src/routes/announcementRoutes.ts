import { Router } from 'express';
import { AnnouncementController } from '../controllers/AnnouncementController';
import { requireAuth, requireRole } from '../middleware/auth';
import { AnnouncementService } from '../services/AnnouncementService';

const router = Router();
const controller = new AnnouncementController(new AnnouncementService());

router.use(requireAuth, requireRole('super_admin', 'administrator'));
router.get('/', controller.list);
router.delete('/bulk', controller.bulkDelete);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
