import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.use(requireAuth);
router.get('/', requireRole('super_admin', 'administrator'), userController.listUsers);
router.delete('/bulk', requireRole('super_admin', 'administrator'), userController.bulkDeleteUsers);
router.get('/:id', requireRole('super_admin', 'administrator'), userController.getUserById);
router.post('/', requireRole('super_admin', 'administrator'), userController.createUser);
router.patch('/:id', requireRole('super_admin', 'administrator'), userController.updateUser);
router.delete('/:id', requireRole('super_admin', 'administrator'), userController.deleteUser);

export default router;
