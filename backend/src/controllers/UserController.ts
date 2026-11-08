import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { createUserSchema, updateUserSchema } from '../dto/UserDto';
import { bulkDeleteUserIdsSchema } from '../dto/BulkDeleteDto';
import { UserService } from '../services/UserService';

export class UserController {
  constructor(private readonly userService: UserService) {}

  listUsers = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.getUsers();
      res.status(200).json({ success: true, data: users.map((user) => user.toJSON()) });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await this.userService.getUserById(userId);
      res.status(user ? 200 : 404).json({
        success: !!user,
        data: user ? user.toJSON() : null,
      });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createUserSchema.parse(req.body);
      const user = await this.userService.createUser(input);
      res.status(201).json({ success: true, data: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const input = updateUserSchema.parse(req.body);
      if (req.user?.sub === userId && (input.status === 'inactive' || (input.role && input.role !== 'administrator'))) {
        res.status(400).json({ success: false, message: 'You cannot remove your own administrator access.' });
        return;
      }

      const user = await this.userService.updateUser(userId, input);
      res.status(user ? 200 : 404).json({
        success: !!user,
        data: user ? user.toJSON() : null,
        ...(!user ? { message: 'User not found.' } : {}),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (req.user?.sub === userId) {
        res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        return;
      }

      const deleted = await this.userService.deleteUser(userId);
      res.status(deleted ? 200 : 404).json({
        success: deleted,
        message: deleted ? 'User deleted.' : 'User not found.',
      });
    } catch (error) {
      next(error);
    }
  };

  bulkDeleteUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = bulkDeleteUserIdsSchema.parse(req.body);
      if (req.user?.sub && ids.includes(req.user.sub)) {
        res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        return;
      }

      const deletedCount = await this.userService.deleteUsers(ids);
      res.status(200).json({ success: true, data: { deletedCount } });
    } catch (error) {
      next(error);
    }
  };
}
