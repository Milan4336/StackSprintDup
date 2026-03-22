import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { router } from './routes';
import { httpRequestsTotal, register } from './utils/metrics';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(',').map((v) => v.trim()),
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(apiRateLimiter);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.requestId
  })
);
app.use(morgan('combined'));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: String(res.statusCode) });
  });
  next();
});

app.use(router);
app.use(errorHandler);
