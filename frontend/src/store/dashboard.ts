import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { monitoringApi, apiClient } from '../api/client';
import { connectSocket, disconnectSocket } from '../services/socket';
import {
  FraudAlert,
  FraudExplanation,
  FraudExplanationRecord,
  RiskLevel,
  Transaction,
  TransactionStats,
  UserDevice
} from '../types';
import { safeDate } from '../utils/date';

interface CreateTxInput {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
}

interface DashboardState {
  transactions: Transaction[];
  stats: TransactionStats | null;
  alerts: FraudAlert[];
  devices: UserDevice[];
  explanations: FraudExplanationRecord[];
  simulationMessage: string | null;
  loading: boolean;
  creating: boolean;
  connected: boolean;
  error: string | null;
  lastUpdated: string | null;
  socket: Socket | null;
  loadDashboardData: () => Promise<void>;
  createTransaction: (input: CreateTxInput) => Promise<Transaction>;
  startSimulation: (count?: number) => Promise<{ generated: number }>;
  connectLive: () => void;
  disconnectLive: () => void;
}

const nextTxId = (): string => `tx-ui-${Date.now()}`;

let liveUpdateTimer: ReturnType<typeof setTimeout> | null = null;
let pendingTransactions: Transaction[] = [];

const MAX_TRANSACTIONS = 300;

function updateStatsIncremental(
  current: TransactionStats | null,
  newTxs: Transaction[],
  allTxs: Transaction[]
): TransactionStats {
  if (!current) {
    const total = allTxs.length;
    const fraudCount = allTxs.filter(tx => tx.isFraud).length;
    const avgRiskScore = total
      ? allTxs.reduce((sum, tx) => sum + tx.fraudScore, 0) / total
      : 0;

    const highRiskUsersMap = new Map<string, number>();
    for (const tx of allTxs) {
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
  }

  let fraudCountDelta = 0;
  let riskScoreDelta = 0;

  for (const tx of newTxs) {
    if (tx.isFraud) fraudCountDelta++;
    riskScoreDelta += tx.fraudScore;
  }

  const total = allTxs.length;

  const newAvg =
    ((current.avgRiskScore * (total - newTxs.length)) + riskScoreDelta) / total;

  const fraudRate =
    ((current.fraudRate * (total - newTxs.length)) + fraudCountDelta) / total;

  const highRiskUsersMap = new Map<string, number>();
  for (const tx of allTxs) {
    if (tx.riskLevel !== 'High') continue;
    highRiskUsersMap.set(tx.userId, (highRiskUsersMap.get(tx.userId) ?? 0) + 1);
  }

  const highRiskUsers = Array.from(highRiskUsersMap.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    fraudRate,
    avgRiskScore: newAvg,
    highRiskUsers
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  transactions: [],
  stats: null,
  alerts: [],
  devices: [],
  explanations: [],
  simulationMessage: null,
  loading: false,
  creating: false,
  connected: false,
  error: null,
  lastUpdated: null,
  socket: null,

  loadDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const [transactions, stats, alerts, devices, explanations] =
        await Promise.all([
          monitoringApi.getTransactions(MAX_TRANSACTIONS),
          monitoringApi.getStats(),
          monitoringApi.getAlerts(120),
          monitoringApi.getDevices(240),
          monitoringApi.getExplanations(120)
        ]);

      set({
        transactions: transactions.slice(0, MAX_TRANSACTIONS),
        stats,
        alerts,
        devices,
        explanations,
        loading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch {
      set({ error: 'Failed to load dashboard', loading: false });
    }
  },

  createTransaction: async (input: CreateTxInput) => {
    set({ creating: true, error: null });

    try {
      const response = await apiClient.post<Transaction>('/transactions', {
        transactionId: nextTxId(),
        userId: input.userId,
        amount: input.amount,
        currency: 'USD',
        location: input.location,
        deviceId: input.deviceId,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString()
      });

      const created = response.data;
      const transactions = [created, ...get().transactions].slice(0, MAX_TRANSACTIONS);

      set({
        transactions,
        stats: updateStatsIncremental(get().stats, [created], transactions),
        creating: false,
        lastUpdated: new Date().toISOString()
      });

      return created;
    } catch {
      set({ creating: false, error: 'Failed to create transaction' });
      throw new Error('Failed to create transaction');
    }
  },

  startSimulation: async (count = 50) => {
    const result = await monitoringApi.startSimulation(count);
    set({ simulationMessage: `Simulation generated ${result.generated} transactions.` });
    return result;
  },

  connectLive: () => {
    if (get().socket) return;

    const socket = connectSocket();

    socket.on('connect', () => {
      set({ connected: true });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('transactions.live', (payload: Record<string, unknown>) => {
      const tx: Transaction = {
        transactionId: String(payload.transactionId ?? `event-${Date.now()}`),
        userId: String(payload.userId ?? 'unknown'),
        amount: Number(payload.amount ?? 0),
        currency: 'USD',
        location: String(payload.location ?? 'Unknown'),
        deviceId: String(payload.deviceId ?? 'unknown-device'),
        ipAddress: '0.0.0.0',
        timestamp:
          safeDate(payload.timestamp as string | number | Date | null)?.toISOString() ??
          new Date().toISOString(),
        fraudScore: Number(payload.fraudScore ?? 0),
        riskLevel: (payload.riskLevel as RiskLevel) ?? 'Low',
        isFraud: Boolean(payload.isFraud ?? false),
        ruleReasons: Array.isArray(payload.ruleReasons) ? (payload.ruleReasons as string[]) : [],
        explanations: (payload.explanations as FraudExplanation[]) ?? []
      };

      pendingTransactions.push(tx);

      if (liveUpdateTimer) return;

      liveUpdateTimer = setTimeout(() => {
        const state = get();

        let transactions = state.transactions;
        const newTxs = pendingTransactions;

        for (const item of newTxs) {
          transactions = [
            item,
            ...transactions.filter(t => t.transactionId !== item.transactionId)
          ].slice(0, MAX_TRANSACTIONS);
        }

        pendingTransactions = [];
        liveUpdateTimer = null;

        set({
          transactions,
          stats: updateStatsIncremental(state.stats, newTxs, transactions),
          lastUpdated: new Date().toISOString()
        });

      }, 500);
    });

    set({ socket });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ socket: null, connected: false });
  }
}));