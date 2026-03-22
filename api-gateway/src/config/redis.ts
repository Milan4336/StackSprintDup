import Redis from 'ioredis';
import { env } from './env';

export const redisClient = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
});
