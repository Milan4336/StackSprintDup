import { describe, expect, it, vi } from 'vitest';
import { computeStatsFromTransactions, normalizeTransaction, parseArrayResponse, upsertTransaction } from './transactions';
import { Transaction } from '../types';

describe('transactions helpers', () => {
  it('computes summary stats from recent transactions', () => {
    const transactions: Transaction[] = [
      {
        transactionId: 'tx-1',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        location: 'NY',
        deviceId: 'device-1',
        ipAddress: '127.0.0.1',
        timestamp: '2026-01-01T00:00:00.000Z',
        fraudScore: 20,
        riskLevel: 'Low',
        isFraud: false
      },
      {
        transactionId: 'tx-2',
        userId: 'user-2',
        amount: 200,
        currency: 'USD',
        location: 'CA',
        deviceId: 'device-2',
        ipAddress: '127.0.0.1',
        timestamp: '2026-01-01T01:00:00.000Z',
        fraudScore: 90,
        riskLevel: 'High',
        isFraud: true
      },
      {
        transactionId: 'tx-3',
        userId: 'user-2',
        amount: 300,
        currency: 'USD',
        location: 'TX',
        deviceId: 'device-3',
        ipAddress: '127.0.0.1',
        timestamp: '2026-01-01T02:00:00.000Z',
        fraudScore: 70,
        riskLevel: 'High',
        isFraud: true
      }
    ];

    expect(computeStatsFromTransactions(transactions)).toEqual({
      fraudRate: 2 / 3,
      avgRiskScore: 60,
      highRiskUsers: [{ userId: 'user-2', count: 2 }]
    });
  });

  it('normalizes partial transaction payloads safely', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));

    expect(
      normalizeTransaction({
        amount: '75' as unknown as number,
        riskLevel: 'High',
        location: 'Seattle'
      })
    ).toMatchObject({
      userId: 'unknown-user',
      amount: 75,
      currency: 'USD',
      location: 'Seattle',
      riskLevel: 'High',
      isFraud: true,
      timestamp: '2026-01-01T12:00:00.000Z'
    });

    vi.useRealTimers();
  });

  it('upserts by transaction id and preserves newest value', () => {
    const first = normalizeTransaction({
      transactionId: 'tx-1',
      userId: 'user-1',
      amount: 10,
      riskLevel: 'Low',
      timestamp: '2026-01-01T00:00:00.000Z'
    });

    const updated = upsertTransaction([first], {
      transactionId: 'tx-1',
      userId: 'user-1',
      amount: 99,
      riskLevel: 'Medium',
      timestamp: '2026-01-01T01:00:00.000Z'
    });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      transactionId: 'tx-1',
      amount: 99,
      riskLevel: 'Medium'
    });
  });

  it('parses array and wrapped array responses', () => {
    expect(parseArrayResponse([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(parseArrayResponse({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(parseArrayResponse({ nope: true })).toEqual([]);
  });
});
