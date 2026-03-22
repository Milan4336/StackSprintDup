import type { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: JwtPayload;
    }
  }
}

export {};
