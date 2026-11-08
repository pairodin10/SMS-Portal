import { Router } from 'express';
import { ImeiSettingsController } from '../controllers/ImeiSettingsController';
import { requireAuth, requireRole } from '../middleware/auth';
import { ImeiSettingsService } from '../services/ImeiSettingsService';

const router = Router();
const controller = new ImeiSettingsController(new ImeiSettingsService());

router.use(requireAuth);
router.get('/active', controller.listActive);
router.get('/', requireRole('super_admin', 'administrator'), controller.list);
router.delete('/bulk', requireRole('super_admin', 'administrator'), controller.bulkDelete);
router.post('/', requireRole('super_admin', 'administrator'), controller.create);
router.patch('/:id', requireRole('super_admin', 'administrator'), controller.update);
router.delete('/:id', requireRole('super_admin', 'administrator'), controller.delete);

export default router;
