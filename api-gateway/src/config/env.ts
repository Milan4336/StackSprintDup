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
  SCORE_RULE_WEIGHT: z.coerce.number().default(0.2),
  SCORE_ML_WEIGHT: z.coerce.number().default(0.4),
  SCORE_BEHAVIOR_WEIGHT: z.coerce.number().default(0.25),
  SCORE_GRAPH_WEIGHT: z.coerce.number().default(0.15),
  AUTONOMOUS_ALERT_THRESHOLD: z.coerce.number().default(80),
  GEOIP_API_URL: z.string().url().default('https://ipwho.is'),
  GEO_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).default(86400),
  MODEL_NAME: z.string().default('IsolationForest-Fraud-v1'),
  MODEL_VERSION: z.string().default('1.0.0'),
  ML_CIRCUIT_FAIL_THRESHOLD: z.coerce.number().int().min(1).default(3),
  ML_CIRCUIT_RESET_SECONDS: z.coerce.number().int().min(5).default(60),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX_HOST: z.string().optional(),
  PINECONE_NAMESPACE: z.string().default('fraud-copilot'),
  RAG_VECTOR_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
  SECRET_PROVIDER: z.enum(['env', 'vault']).default('env'),
  VAULT_ADDR: z.string().url().optional(),
  VAULT_TOKEN: z.string().optional(),
  VAULT_PATH: z.string().default('secret/data/stack-sprint'),
  MFA_TOTP_ISSUER: z.string().default('Stack Sprint Fraud Command Center'),
  LOCKDOWN_THREAT_THRESHOLD: z.coerce.number().int().min(1).max(100).default(90),
  LOKI_PUSH_URL: z.string().optional(),
  LOKI_LABELS: z.string().default('service=api-gateway,stack=stack-sprint'),
  DOCKER_SOCKET_PATH: z.string().default('/var/run/docker.sock'),
  DOCKER_CONTAINERS: z.string().optional(),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(20),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().min(1).default(8),
  OLLAMA_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('mistral')
});

export const env = envSchema.parse(process.env);
