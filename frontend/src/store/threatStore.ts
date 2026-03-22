import { create } from 'zustand';
import { MlStatus } from '../types';
import { safeDate } from '../utils/date';
import { getSocket } from '../services/socket';

export type ThreatLevel = 'NORMAL' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';

const HIGH_RISK_WINDOW_MS = 5 * 60 * 1000;
const HIGH_RISK_BURST_THRESHOLD = 4;
const ELEVATED_FRAUD_RATE = 12;
const CRITICAL_FRAUD_RATE = 25;
const LOCKDOWN_THRESHOLD = (() => {
  const raw = Number(import.meta.env.VITE_LOCKDOWN_THREAT_THRESHOLD ?? 90);
  if (Number.isNaN(raw)) return 90;
  return Math.max(1, Math.min(100, raw));
})();

interface ThreatEvaluation {
  threatLevel: ThreatLevel;
  reason: string;
}

interface AlertLike {
  riskLevel?: string;
  fraudScore?: number;
  createdAt?: string;
  timestamp?: string;
}

interface ThreatStoreState {
  threatLevel: ThreatLevel;
  threatIndex: number;
  recentHighRiskCount: number;
  fraudRate: number;
  mlStatus: MlStatus;
  simulationActive: boolean;
  reason: string;
  highRiskAlertTimestamps: number[];
  safeMode: boolean;
  listenersAttached?: boolean;
  setThreatIndex: (value: number) => void;
  setFraudRate: (rate: number) => void;
  setMlStatus: (status: MlStatus) => void;
  setSimulationActive: (active: boolean) => void;
  setSafeMode: (active: boolean) => void;
  ingestAlert: (alert: AlertLike) => void;
  syncRecentHighRiskFromAlerts: (alerts: AlertLike[]) => void;
  recomputeThreat: () => void;
  resetThreatState: () => void;
  connectThreatSocket: () => void;
}

const clampFraudRate = (value: number): number => Math.max(0, Math.min(100, value));

const normalizeTimestamp = (value?: string): number => safeDate(value)?.getTime() ?? Date.now();

const pruneHighRiskWindow = (timestamps: number[], now = Date.now()): number[] =>
  timestamps.filter((ts) => now - ts <= HIGH_RISK_WINDOW_MS);

const evaluateThreat = (state: Pick<ThreatStoreState, 'fraudRate' | 'recentHighRiskCount' | 'mlStatus' | 'simulationActive'>): ThreatEvaluation => {
  if (state.recentHighRiskCount >= HIGH_RISK_BURST_THRESHOLD) {
    return {
      threatLevel: 'CRITICAL',
      reason: `High-risk alert burst detected (${state.recentHighRiskCount} in last 5 minutes).`
    };
  }

  if (state.fraudRate >= CRITICAL_FRAUD_RATE) {
    return {
      threatLevel: 'CRITICAL',
      reason: `Fraud rate is critically high (${state.fraudRate.toFixed(1)}%).`
    };
  }

  if (state.mlStatus === 'OFFLINE') {
    return {
      threatLevel: 'SUSPICIOUS',
      reason: 'ML service is offline. Platform is running in fallback mode.'
    };
  }

  if (state.simulationActive) {
    return {
      threatLevel: 'SUSPICIOUS',
      reason: 'Fraud simulation is active.'
    };
  }

  if (state.mlStatus === 'DEGRADED') {
    return {
      threatLevel: 'SUSPICIOUS',
      reason: 'ML service is degraded.'
    };
  }

  if (state.fraudRate >= ELEVATED_FRAUD_RATE) {
    return {
      threatLevel: 'SUSPICIOUS',
      reason: `Fraud rate is suspiciously high (${state.fraudRate.toFixed(1)}%).`
    };
  }

  return {
    threatLevel: 'NORMAL',
    reason: 'Threat indicators are within baseline levels.'
  };
};

export const useThreatStore = create<ThreatStoreState>((set, get) => ({
  threatLevel: 'NORMAL',
  threatIndex: 0,
  recentHighRiskCount: 0,
  fraudRate: 0,
  mlStatus: 'HEALTHY',
  simulationActive: false,
  safeMode: false,
  reason: 'Threat indicators are within baseline levels.',
  highRiskAlertTimestamps: [],

  setThreatIndex: (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));

    const current = get().threatIndex;
    // For critical spikes, bypass smoothing so lockdown controls trigger immediately.
    const shouldBypassSmoothing = clamped >= LOCKDOWN_THRESHOLD || Math.abs(clamped - current) >= 35;
    const smoothed = shouldBypassSmoothing
      ? clamped
      : Math.round(current + (clamped - current) * 0.4);

    const level: ThreatLevel =
      smoothed >= 90 ? 'CRITICAL' :
        smoothed >= 70 ? 'HIGH' :
          smoothed >= 40 ? 'SUSPICIOUS' : 'NORMAL';
    set({ threatIndex: smoothed, threatLevel: level });
  },

  setFraudRate: (rate) => {
    set({
      fraudRate: clampFraudRate(Number.isFinite(rate) ? rate : 0)
    });
    get().recomputeThreat();
  },

  setMlStatus: (status) => {
    set({ mlStatus: status });
    get().recomputeThreat();
  },

  setSimulationActive: (active) => {
    set({ simulationActive: active });
    get().recomputeThreat();
  },

  setSafeMode: (active) => {
    set({ safeMode: active });
  },

  ingestAlert: (alert) => {
    const isHighRisk = alert.riskLevel === 'High' || Number(alert.fraudScore ?? 0) >= 71;
    if (!isHighRisk) {
      return;
    }

    set((state) => {
      const nextTimestamps = pruneHighRiskWindow([
        ...state.highRiskAlertTimestamps,
        normalizeTimestamp(alert.createdAt ?? alert.timestamp)
      ]);

      return {
        highRiskAlertTimestamps: nextTimestamps,
        recentHighRiskCount: nextTimestamps.length
      };
    });
    get().recomputeThreat();
  },

  syncRecentHighRiskFromAlerts: (alerts) => {
    const now = Date.now();
    const timestamps = alerts
      .filter((alert) => alert.riskLevel === 'High' || Number(alert.fraudScore ?? 0) >= 71)
      .map((alert) => normalizeTimestamp(alert.createdAt ?? alert.timestamp))
      .filter((ts) => now - ts <= HIGH_RISK_WINDOW_MS);

    set({
      highRiskAlertTimestamps: timestamps,
      recentHighRiskCount: timestamps.length
    });
    get().recomputeThreat();
  },

  recomputeThreat: () => {
    set((state) => {
      const nextWindow = pruneHighRiskWindow(state.highRiskAlertTimestamps);
      const evaluation = evaluateThreat({
        fraudRate: state.fraudRate,
        recentHighRiskCount: nextWindow.length,
        mlStatus: state.mlStatus,
        simulationActive: state.simulationActive
      });

      return {
        highRiskAlertTimestamps: nextWindow,
        recentHighRiskCount: nextWindow.length,
        threatLevel: evaluation.threatLevel,
        reason: evaluation.reason
      };
    });
  },

  resetThreatState: () => {
    set({
      threatLevel: 'NORMAL',
      threatIndex: 0,
      recentHighRiskCount: 0,
      fraudRate: 0,
      mlStatus: 'HEALTHY',
      simulationActive: false,
      safeMode: false,
      reason: 'Threat indicators are within baseline levels.',
      highRiskAlertTimestamps: []
    });
  },

  connectThreatSocket: () => {
    const socket = getSocket();
    socket.on('system.threatIndex', (payload: any) => {
      // Backend emits { score: 0-1 } OR { value: 0-100 } — handle both
      const raw = payload?.score ?? payload?.value ?? null;
      if (raw !== null) {
        const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
        get().setThreatIndex(normalized);
      }
    });
    socket.on('system.status', (payload: { fraudRate?: number; mlStatus?: MlStatus }) => {
      if (typeof payload.fraudRate === 'number') {
        get().setFraudRate(payload.fraudRate);
      }
      if (payload.mlStatus) {
        get().setMlStatus(payload.mlStatus);
      }
    });
    socket.on('system.safemode', (payload: { active: boolean }) => {
      get().setSafeMode(payload.active);
    });
  }
}));
