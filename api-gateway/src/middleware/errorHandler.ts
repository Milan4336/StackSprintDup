import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const appError = err instanceof AppError ? err : new AppError('Internal server error', 500);

  logger.error(
    {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      statusCode: appError.statusCode,
      details: appError.details,
      error: err.message
    },
    'Request failed'
  );

  res.status(appError.statusCode).json({
    error: appError.message,
    requestId: req.requestId,
    details: appError.details
  });
};
