import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/errors';

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction): void => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten());
  }
  req.body = parsed.data;
  next();
};
