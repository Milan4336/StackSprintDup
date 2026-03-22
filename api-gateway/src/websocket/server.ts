import { Server as HttpServer } from 'http';
import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { redisClient } from '../config/redis';
import { verifyJwt } from '../utils/jwt';

const resolveToken = (candidate: unknown): string | null => {
  if (typeof candidate !== 'string') return null;
  if (candidate.startsWith('Bearer ')) return candidate.slice(7).trim();
  return candidate.trim();
};

class GatewayWebSocketServer {
  private io?: SocketIOServer;
  private subscriber?: Redis;

  async initialize(httpServer: HttpServer): Promise<void> {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.ALLOWED_ORIGINS.split(',').map((v) => v.trim()),
        credentials: true
      }
    });

    this.io.use((socket, next) => {
      const authToken = resolveToken(socket.handshake.auth?.token);
      const headerToken = resolveToken(socket.handshake.headers.authorization);
      const token = authToken ?? headerToken;

      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      try {
        verifyJwt(token);
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });

    this.io.on('connection', (socket) => {
      socket.emit('system.status', {
        status: 'connected',
        at: new Date().toISOString()
      });
    });

    this.subscriber = redisClient.duplicate();

    await this.subscriber.subscribe('transactions.live', 'fraud.alerts', 'simulation.events');

    this.subscriber.on('message', (channel, message) => {
      if (!this.io) return;

      try {
        const payload = JSON.parse(message);
        this.io.emit(channel, payload);
      } catch {
        logger.warn({ channel }, 'Failed to parse websocket payload');
      }
    });

    logger.info('WebSocket server initialized');
  }
}

export const gatewayWebSocketServer = new GatewayWebSocketServer();
