import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { DeviceIntelligenceService } from '../services/DeviceIntelligenceService';
import { logger } from '../config/logger';

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceIntelligenceService: DeviceIntelligenceService
  ) { }

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
      const { email, password, deviceFingerprint } = req.body;
      const result = await this.authService.login(email, password);

      // Evaluate Device Fingerprint if provided in body or header
      let fp = deviceFingerprint;
      if (!fp && req.headers['x-device-fingerprint']) {
        try {
          fp = JSON.parse(Buffer.from(req.headers['x-device-fingerprint'] as string, 'base64').toString('ascii'));
        } catch (e) { }
      }
      if (fp) {
        await this.deviceIntelligenceService.evaluateDevice(email, fp);
      }

      res.status(200).json(result);
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('invalid')) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      if (error?.message?.toLowerCase().includes('frozen')) {
        res.status(403).json({ error: error.message });
        return;
      }
      logger.error({ error }, 'Login failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  setupMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.authService.setupMfa(userId);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
      const message = typeof error?.message === 'string' ? error.message : 'Internal server error';
      logger.error({ error }, 'MFA setup failed');
      res.status(statusCode).json({ error: message });
    }
  };

  enableMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { code } = req.body as { code?: string };
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!code) {
        res.status(400).json({ error: 'MFA code is required' });
        return;
      }

      const result = await this.authService.enableMfa(userId, code);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
      const message = typeof error?.message === 'string' ? error.message : 'Internal server error';
      logger.error({ error }, 'MFA enable failed');
      res.status(statusCode).json({ error: message });
    }
  };

  verifyMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { code, reason } = req.body as { code?: string; reason?: string };
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!code) {
        res.status(400).json({ error: 'MFA code is required' });
        return;
      }

      const verificationReason = reason || (req.user?.mfaPending ? 'LOGIN_CHALLENGE' : 'THREAT_LOCKDOWN');
      const result = await this.authService.verifyMfa(userId, code, verificationReason);
      res.status(200).json(result);
    } catch (error: any) {
      const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
      const message = typeof error?.message === 'string' ? error.message : 'Internal server error';
      logger.error({ error }, 'MFA verify failed');
      res.status(statusCode).json({ error: message });
    }
  };

  mfaStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const status = await this.authService.mfaStatus(userId);
      res.status(200).json(status);
    } catch (error: any) {
      const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
      const message = typeof error?.message === 'string' ? error.message : 'Internal server error';
      logger.error({ error }, 'MFA status failed');
      res.status(statusCode).json({ error: message });
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

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = (req as any).user.email;
      const user = await this.authService.me(email);

      // Evaluate Device Fingerprint during session checks
      const { deviceFingerprint } = req.body ?? {};
      let fp = deviceFingerprint;
      if (!fp && req.headers['x-device-fingerprint']) {
        try {
          fp = JSON.parse(Buffer.from(req.headers['x-device-fingerprint'] as string, 'base64').toString('ascii'));
        } catch (e) { }
      }
      if (fp) {
        await this.deviceIntelligenceService.evaluateDevice(user.userId || email, fp);
      }

      res.status(200).json(user);
    } catch (error: any) {
      logger.error({ error }, 'Get me failed');
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
