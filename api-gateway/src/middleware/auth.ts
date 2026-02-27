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
  next();
};

export const roleMiddleware = (allowedRoles: Array<'admin' | 'analyst'>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    // Explicit comparison to bypass strict array-includes issues in some TS environments
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.some(role => String(role) === String(userRole))) {
      throw new AppError('Forbidden', 403);
    }
    next();
  };
