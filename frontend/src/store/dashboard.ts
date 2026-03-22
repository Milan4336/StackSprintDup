import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { monitoringApi } from '../api/client';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { FraudAlert, FraudExplanationRecord, Transaction, UserDevice } from '../types';
import { normalizeTransaction } from '../lib/transactions';

interface DashboardState {
  alerts: FraudAlert[];
  devices: UserDevice[];
  explanations: FraudExplanationRecord[];
  simulationMessage: string | null;
  loading: boolean;
  connected: boolean;
  error: string | null;
  lastUpdated: string | null;
  socket: Socket | null;
  loadDashboardData: () => Promise<void>;
  startSimulation: (count?: number) => Promise<{ generated: number }>;
  connectLive: () => void;
  disconnectLive: () => void;
}

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
  alerts: [],
  devices: [],
  explanations: [],
  simulationMessage: null,
  loading: false,
  connected: false,
  error: null,
  lastUpdated: null,
  socket: null,

  loadDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const [alerts, devices, explanations] = await Promise.all([
        monitoringApi.getAlerts(120),
        monitoringApi.getDevices(240),
        monitoringApi.getExplanations(120)
      ]);

      set({
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
      const tx = normalizeTransaction(payload as Partial<Transaction>);
      const devices = upsertDeviceFromTransaction(get().devices, tx);
      const explanations = upsertExplanationFromTransaction(get().explanations, tx);

      set({
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
