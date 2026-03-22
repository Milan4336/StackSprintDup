import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { verifyJwt } from '../utils/jwt';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing bearer token', 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  req.user = verifyJwt(token);

  if (req.user?.mfaPending) {
    const path = req.path.toLowerCase();
    const allowedWhilePending =
      path === '/api/v1/auth/mfa/verify' ||
      path === '/api/v1/auth/mfa/status';

    if (!allowedWhilePending) {
      throw new AppError('MFA verification required', 401);
    }
  }

  next();
};

export const roleMiddleware = (allowedRoles: Array<'admin' | 'analyst' | 'user'>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    // Explicit comparison to bypass strict array-includes issues in some TS environments
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.some(role => String(role) === String(userRole))) {
      throw new AppError('Forbidden', 403);
    }
    next();
  };
