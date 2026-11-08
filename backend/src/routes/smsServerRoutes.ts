import { Router } from 'express';
import { SmsServerController } from '../controllers/SmsServerController';
import { requireAuth, requireRole } from '../middleware/auth';
import { SmsServerService } from '../services/SmsServerService';
import { AllanGatewayController } from '../controllers/AllanGatewayController';
import { AllanGatewayService } from '../services/AllanGatewayService';

const router = Router();
const controller = new SmsServerController(new SmsServerService());
const allanGatewayController = new AllanGatewayController(new AllanGatewayService());

router.use(requireAuth);
router.get('/available-gateways', requireRole('super_admin', 'administrator', 'operator', 'viewer'), allanGatewayController.listActive);
router.use(requireRole('super_admin', 'administrator'));
router.get('/allan-gateways', allanGatewayController.list);
router.delete('/allan-gateways/bulk', allanGatewayController.bulkDelete);
router.post('/allan-gateways', allanGatewayController.create);
router.patch('/allan-gateways/:id', allanGatewayController.update);
router.delete('/allan-gateways/:id', allanGatewayController.delete);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
