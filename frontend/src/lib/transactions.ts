import { RiskLevel, Transaction, TransactionStats } from '../types';
import { safeDate } from '../utils/date';

export const computeStatsFromTransactions = (transactions: Transaction[]): TransactionStats => {
  const total = transactions.length;
  const fraudCount = transactions.filter((tx) => tx.isFraud).length;
  const avgRiskScore = total ? transactions.reduce((sum, tx) => sum + tx.fraudScore, 0) / total : 0;

  const highRiskUsersMap = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.riskLevel !== 'High') continue;
    highRiskUsersMap.set(tx.userId, (highRiskUsersMap.get(tx.userId) ?? 0) + 1);
  }

  const highRiskUsers = Array.from(highRiskUsersMap.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    fraudRate: total ? fraudCount / total : 0,
    avgRiskScore,
    highRiskUsers
  };
};

export const normalizeTransaction = (raw: Partial<Transaction>): Transaction => {
  const timestamp = safeDate(raw.timestamp)?.toISOString() ?? new Date().toISOString();
  const riskLevel = (raw.riskLevel as RiskLevel | undefined) ?? 'Low';

  return {
    transactionId: raw.transactionId || `event-${Date.now()}`,
    userId: raw.userId || 'unknown-user',
    amount: Number(raw.amount ?? 0),
    currency: raw.currency || 'USD',
    location: raw.location || 'Unknown',
    latitude: typeof raw.latitude === 'number' ? raw.latitude : undefined,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : undefined,
    deviceId: raw.deviceId || 'unknown-device',
    ipAddress: raw.ipAddress || '0.0.0.0',
    timestamp,
    fraudScore: Number(raw.fraudScore ?? 0),
    riskLevel,
    isFraud: Boolean(raw.isFraud ?? riskLevel === 'High'),
    explanations: raw.explanations
  };
};

export const upsertTransaction = (transactions: Transaction[], raw: Partial<Transaction>, limit = 600): Transaction[] => {
  const next = normalizeTransaction(raw);
  return [next, ...transactions.filter((tx) => tx.transactionId !== next.transactionId)].slice(0, limit);
};

export const parseArrayResponse = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
};
