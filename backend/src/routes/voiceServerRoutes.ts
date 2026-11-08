import { Router } from 'express';
import { VoiceServerController } from '../controllers/VoiceServerController';
import { requireAuth, requireRole } from '../middleware/auth';
import { VoiceServerService } from '../services/VoiceServerService';

const router = Router();
const controller = new VoiceServerController(new VoiceServerService());

router.use(requireAuth, requireRole('super_admin', 'administrator'));
router.get('/', controller.list);
router.delete('/bulk', controller.bulkDelete);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
