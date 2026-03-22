import { z } from 'zod';

export const createTransactionSchema = z.object({
  transactionId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  location: z.string().min(2),
  deviceId: z.string().min(1),
  ipAddress: z.string().ip(),
  timestamp: z.string().datetime()
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  role: z.enum(['admin', 'analyst'])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const simulationSchema = z.object({
  count: z.number().int().min(1).max(500).optional()
});
