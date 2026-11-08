import { Request, Response, NextFunction } from 'express';
import { registerSchema } from '../dto/LoginDto';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier, email, username, password } = req.body;
      const result = await this.authService.login({
        identifier: identifier ?? username ?? email,
        password,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registerSchema.parse(req.body);
      const result = await this.authService.register(input);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  currentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user ? await this.authService.getUserById(req.user.sub) : null;
      if (!user) {
        res.status(404).json({ success: false, message: 'Signed-in user was not found.' });
        return;
      }
      res.status(200).json({ success: true, data: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };
}
