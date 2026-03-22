import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URI);
  logger.info('MongoDB connected');
};
