import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  MONGO_URI: z.string().min(1),
  REDIS_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  ML_SERVICE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  HIGH_AMOUNT_THRESHOLD: z.coerce.number().default(5000),
  VELOCITY_WINDOW_MINUTES: z.coerce.number().default(5),
  VELOCITY_TX_THRESHOLD: z.coerce.number().default(5),
  SCORE_RULE_WEIGHT: z.coerce.number().default(0.6),
  SCORE_ML_WEIGHT: z.coerce.number().default(0.4),
  AUTONOMOUS_ALERT_THRESHOLD: z.coerce.number().default(80)
});

export const env = envSchema.parse(process.env);
