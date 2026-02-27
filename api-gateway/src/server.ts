import { createServer } from 'http';
import { app } from './app';
import { connectMongo } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { redisClient } from './config/redis';
import { gatewayWebSocketServer } from './websocket/server';

const bootstrap = async (): Promise<void> => {
  try {
    logger.info('Starting API Gateway...');

    const httpServer = createServer(app);

    await gatewayWebSocketServer.initialize(httpServer);

    // Start server FIRST
    httpServer.listen(env.PORT || 8080, "0.0.0.0", () => {
      logger.info(`API Gateway listening on ${env.PORT || 8080}`);
    });

    // Connect Mongo in background
    connectMongo()
      .then(() => {
        logger.info('Mongo connected');
        import('./services/DashboardIntelligenceService').then(({ dashboardIntelligenceService }) => {
          dashboardIntelligenceService.startBackgroundWorker();
        });
      })
      .catch((error) =>
        logger.error({ error }, 'Mongo connection failed')
      );


  } catch (error) {
    logger.error({ error }, 'Bootstrap failure');
  }
};

bootstrap();