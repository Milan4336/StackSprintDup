import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { monitoringApi, apiClient } from '../api/client';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import {
  FraudAlert,
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

const computeStatsFromTransactions = (transactions: Transaction[]): TransactionStats => {
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

const mergeTransactionEvent = (event: Record<string, unknown>): Transaction => {
  const riskLevel = (event.riskLevel as RiskLevel | undefined) ?? 'Low';
  const explanationsRaw = Array.isArray(event.explanations) ? event.explanations : [];
  const timestamp = safeDate(event.timestamp as string | number | Date | null)?.toISOString() ?? new Date().toISOString();

  return {
    transactionId: String(event.transactionId ?? `event-${Date.now()}`),
    userId: String(event.userId ?? 'unknown-user'),
    amount: Number(event.amount ?? 0),
    currency: 'USD',
    location: String(event.location ?? 'Unknown'),
    latitude: typeof event.latitude === 'number' ? event.latitude : undefined,
    longitude: typeof event.longitude === 'number' ? event.longitude : undefined,
    deviceId: String(event.deviceId ?? 'unknown-device'),
    ipAddress: '0.0.0.0',
    timestamp,
    fraudScore: Number(event.fraudScore ?? 0),
    riskLevel,
    isFraud: Boolean(event.isFraud ?? riskLevel === 'High'),
    explanations: explanationsRaw as Transaction['explanations']
  };
};

const upsertDeviceFromTransaction = (devices: UserDevice[], tx: Transaction): UserDevice[] => {
  const nowIso = new Date().toISOString();
  const lastSeen = tx.timestamp || nowIso;
  const idx = devices.findIndex((device) => device.userId === tx.userId && device.deviceId === tx.deviceId);

  if (idx === -1) {
    const next: UserDevice = {
      userId: tx.userId,
      deviceId: tx.deviceId,
      location: tx.location,
      firstSeen: lastSeen,
      lastSeen,
      txCount: 1,
      isSuspicious: tx.riskLevel === 'High' || tx.deviceId.startsWith('unknown'),
      riskLevel: tx.riskLevel
    };
    return [next, ...devices].slice(0, 300);
  }

  const current = devices[idx];
  const updated: UserDevice = {
    ...current,
    location: tx.location,
    lastSeen,
    txCount: (current.txCount ?? 0) + 1,
    isSuspicious: current.isSuspicious || tx.riskLevel === 'High' || tx.deviceId.startsWith('unknown'),
    riskLevel: tx.riskLevel === 'High' ? 'High' : current.riskLevel
  };
  const clone = [...devices];
  clone[idx] = updated;
  return clone;
};

const upsertExplanationFromTransaction = (
  explanations: FraudExplanationRecord[],
  tx: Transaction
): FraudExplanationRecord[] => {
  if (!tx.explanations?.length) {
    return explanations;
  }

  const next: FraudExplanationRecord = {
    transactionId: tx.transactionId,
    userId: tx.userId,
    fraudScore: tx.fraudScore,
    explanations: tx.explanations,
    createdAt: tx.timestamp || new Date().toISOString()
  };

  return [next, ...explanations.filter((item) => item.transactionId !== tx.transactionId)].slice(0, 200);
};

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
      const [transactions, stats, alerts, devices, explanations] = await Promise.all([
        monitoringApi.getTransactions(300),
        monitoringApi.getStats(),
        monitoringApi.getAlerts(120),
        monitoringApi.getDevices(240),
        monitoringApi.getExplanations(120)
      ]);

      set({
        transactions,
        stats,
        alerts,
        devices,
        explanations,
        loading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      const fallback =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: string }).message)
          : 'Failed to load dashboard';
      set({ error: fallback, loading: false });
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
      const transactions = [created, ...get().transactions].slice(0, 500);
      set({
        transactions,
        stats: computeStatsFromTransactions(transactions),
        creating: false,
        lastUpdated: new Date().toISOString()
      });
      return created;
    } catch (error) {
      const fallback =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: string }).message)
          : 'Failed to create transaction';
      set({ creating: false, error: fallback });
      throw error;
    }
  },

  startSimulation: async (count = 50) => {
    const result = await monitoringApi.startSimulation(count);
    set({ simulationMessage: `Simulation generated ${result.generated} transactions.` });
    return result;
  },

  connectLive: () => {
    const existing = getSocket() ?? get().socket;
    if (existing) return;
    const socket = connectSocket();

    socket.on('connect', () => {
      set({ connected: true });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('transactions.live', (payload: Record<string, unknown>) => {
      const tx = mergeTransactionEvent(payload);
      const transactions = [tx, ...get().transactions.filter((item) => item.transactionId !== tx.transactionId)].slice(
        0,
        500
      );
      const devices = upsertDeviceFromTransaction(get().devices, tx);
      const explanations = upsertExplanationFromTransaction(get().explanations, tx);

      set({
        transactions,
        stats: computeStatsFromTransactions(transactions),
        devices,
        explanations,
        lastUpdated: new Date().toISOString()
      });
    });

    socket.on('fraud.alerts', (payload: FraudAlert) => {
      set({
        alerts: [payload, ...get().alerts].slice(0, 200),
        lastUpdated: new Date().toISOString()
      });
    });

    socket.on('simulation.events', (payload: { type: string; count: number }) => {
      set({
        simulationMessage:
          payload.type === 'simulation.completed'
            ? `Simulation completed with ${payload.count} events.`
            : `Simulation started for ${payload.count} events.`
      });
    });

    set({ socket });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ socket: null, connected: false });
  }
}));
