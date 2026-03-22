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

// All Redis channels that the dashboard needs forwarded to Socket.IO clients
const SUBSCRIBED_CHANNELS = [
  // Transaction events
  'transactions.live',
  'transactions.created',
  // Fraud / alert events
  'fraud.alerts',
  // Simulation events
  'simulation.events',
  // Dashboard Intelligence Cron events
  'system.threatIndex',
  'system.riskPulse',
  'system.spike',
  'system.modelConfidence',
  'velocity.live',
  'drift.live',
  'risk.forecast',
  'alerts.pressure',
  // Geo & Collusion
  'geo.live',
  'collusion.detected',
  // System actions feed
  'system.actions',
];

class GatewayWebSocketServer {
  private io?: SocketIOServer;
  private subscriber?: Redis;
  private initialized = false;

  async initialize(httpServer: HttpServer): Promise<void> {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.ALLOWED_ORIGINS.split(',').map((v) => v.trim()),
        credentials: true
      }
    });

    this.io.use((socket, next) => {
      try {
        const token = resolveToken(socket.handshake.auth?.token || socket.handshake.headers?.authorization);
        if (!token) return next(new Error('Authentication error'));
        const decoded = verifyJwt(token);
        (socket as any).user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      socket.emit('system.status', {
        status: 'connected',
        at: new Date().toISOString()
      });
      logger.info({ socketId: socket.id }, 'Client connected');

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Client disconnected');
      });
    });

    this.subscriber = redisClient.duplicate();
    await this.subscriber.subscribe(...SUBSCRIBED_CHANNELS);

    this.subscriber.on('message', (channel, message) => {
      if (!this.io) return;
      try {
        const parsed = JSON.parse(message);
        // RealtimeEventBus wraps in { event, timestamp, payload }
        // Emit the inner payload so frontend sees it at the top level,
        // but also emit the full envelope so either format works.
        const payloadToEmit = parsed?.payload ?? parsed;
        this.io.emit(channel, payloadToEmit);
      } catch {
        logger.warn({ channel }, 'Failed to parse websocket payload');
      }
    });

    logger.info({ channels: SUBSCRIBED_CHANNELS }, 'WebSocket server initialized');
    this.initialized = true;
  }

  getStats(): { initialized: boolean; connectedClients: number } {
    return {
      initialized: this.initialized,
      connectedClients: this.io?.engine.clientsCount ?? 0
    };
  }
}

export const gatewayWebSocketServer = new GatewayWebSocketServer();
