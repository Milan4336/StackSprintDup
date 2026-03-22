import { createServer } from 'http';
import { app } from './app';
import { connectMongo } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { redisClient } from './config/redis';
import { gatewayWebSocketServer } from './websocket/server';

const bootstrap = async (): Promise<void> => {
  await Promise.all([connectMongo(), redisClient.ping()]);

  const httpServer = createServer(app);
  await gatewayWebSocketServer.initialize(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`API Gateway listening on ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to bootstrap API gateway');
  process.exit(1);
});
