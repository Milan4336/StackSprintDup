import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../models/User';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const signJwt = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  });

export const verifyJwt = (token: string): JwtPayload => jwt.verify(token, env.JWT_SECRET) as JwtPayload;
