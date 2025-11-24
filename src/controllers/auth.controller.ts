import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authService } from '../services/auth.service';
import { ApiResponseHandler } from '../utils/apiResponse';
import { UserRole } from '@prisma/client';

export const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(Object.values(UserRole)),
  ],
  login: [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  refresh: [body('refreshToken').notEmpty()],
  changePassword: [body('oldPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.register(req.body);
      ApiResponseHandler.success(res, { user }, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      ApiResponseHandler.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      ApiResponseHandler.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      ApiResponseHandler.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logoutAll(req.user!.sub);
      ApiResponseHandler.success(res, null, 'Logged out from all devices successfully');
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await authService.getActiveSessions(req.user!.sub);
      ApiResponseHandler.success(res, { sessions }, 'Active sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.sub, oldPassword, newPassword);
      ApiResponseHandler.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
