import { Router } from 'express';
import { ApiClientController } from '../controllers/ApiClientController';
import { requireAuth, requireRole } from '../middleware/auth';
import { ApiClientService } from '../services/ApiClientService';

const router = Router();
const controller = new ApiClientController(new ApiClientService());

router.use(requireAuth, requireRole('super_admin', 'administrator'));
router.get('/', controller.list);
router.delete('/bulk', controller.bulkDelete);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
