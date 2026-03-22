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

export const CASE_STATUSES = ['NEW', 'UNDER_INVESTIGATION', 'ESCALATED', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'RESOLVED'] as const;
export const CASE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const createCaseSchema = z.object({
  transactionId: z.string().min(1),
  alertId: z.string().min(1).optional(),
  investigatorId: z.string().min(1).optional(),
  status: z.enum(CASE_STATUSES).optional(),
  priority: z.enum(CASE_PRIORITIES).optional(),
  notes: z.array(z.string().min(1)).optional()
});

export const updateCaseSchema = z.object({
  status: z.enum(CASE_STATUSES).optional(),
  priority: z.enum(CASE_PRIORITIES).optional(),
  investigatorId: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

export const updateSettingsSchema = z.object({
  highAmountThreshold: z.number().positive().optional(),
  velocityWindowMinutes: z.number().int().min(1).max(180).optional(),
  velocityTxThreshold: z.number().int().min(1).max(200).optional(),
  scoreRuleWeight: z.number().min(0).max(1).optional(),
  scoreMlWeight: z.number().min(0).max(1).optional(),
  scoreBehaviorWeight: z.number().min(0).max(1).optional(),
  scoreGraphWeight: z.number().min(0).max(1).optional(),
  autonomousAlertThreshold: z.number().min(1).max(100).optional(),
  simulationMode: z.boolean().optional()
});
