import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { logger } from '../config/logger';

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, role } = req.body;
      const result = await this.authService.register(email, password, role);
      res.status(201).json(result);
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }
      if (error?.message?.toLowerCase().includes('exists')) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }
      logger.error({ error }, 'Register failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('invalid')) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      logger.error({ error }, 'Login failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  requestOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;
      const result = await this.authService.requestOtp(userId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error({ error }, 'Request OTP failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, code } = req.body;
      const result = await this.authService.verifyOtp(userId, code);
      res.status(200).json(result);
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('invalid')) {
        res.status(401).json({ error: 'Invalid or expired OTP' });
        return;
      }
      logger.error({ error }, 'Verify OTP failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}