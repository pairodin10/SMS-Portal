import { Router } from 'express';
import { SettingCoverageController } from '../controllers/SettingCoverageController';
import { requireAuth, requireRole } from '../middleware/auth';
import { SettingCoverageService } from '../services/SettingCoverageService';

const router = Router();
const controller = new SettingCoverageController(new SettingCoverageService());

router.use(requireAuth);
router.get('/countries', controller.listActiveCountries);
router.get('/', requireRole('super_admin', 'administrator'), controller.list);
router.delete('/bulk', requireRole('super_admin', 'administrator'), controller.bulkDelete);
router.post('/', requireRole('super_admin', 'administrator'), controller.create);
router.patch('/:id', requireRole('super_admin', 'administrator'), controller.update);
router.delete('/:id', requireRole('super_admin', 'administrator'), controller.delete);

export default router;
