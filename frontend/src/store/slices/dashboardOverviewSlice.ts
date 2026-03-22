import { create } from 'zustand';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket';

interface State {
  connected: boolean;
  threatIndex: number;
  riskPulse: number;
  velocity: number;
  alertsPressure: number;
  transactionCount: number;
  alertCount: number;
  setOverviewData: (data: any) => void;
  connectLive: () => void;
  disconnectLive: () => void;
}

interface State {
  connected: boolean;
  threatIndex: number;
  riskPulse: number;
  velocity: number;
  alertsPressure: number;
  transactionCount: number;
  alertCount: number;
  listenersAttached: boolean;
  setOverviewData: (data: any) => void;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useDashboardOverviewSlice = create<State>((set, get) => ({
  connected: false,
  threatIndex: 0,
  riskPulse: 0,
  velocity: 0,
  alertsPressure: 0,
  transactionCount: 0,
  alertCount: 0,
  listenersAttached: false,

  setOverviewData: (data: any) => set((state) => ({
    threatIndex: data.threatIndex ?? state.threatIndex,
    riskPulse: data.riskPulse ?? state.riskPulse,
    velocity: data.velocity ?? state.velocity,
    alertsPressure: data.alertsPressure ?? state.alertsPressure,
    transactionCount: data.transactionCount ?? state.transactionCount,
    alertCount: data.alertCount ?? state.alertCount,
  })),

  connectLive: () => {
    const socket = connectSocket();
    set({ connected: socket.connected });

    if (get().listenersAttached) return;

    socket.on('connect', () => {
      console.log('Dashboard socket connected');
      set({ connected: true });
    });

    socket.on('connect_error', (err) => {
      console.error('Dashboard socket error:', err);
      set({ connected: false });
    });

    socket.on('disconnect', (reason) => {
      console.log('Dashboard socket disconnected:', reason);
      set({ connected: false });
    });

    socket.on('system.riskPulse', (payload: any) => {
      if (payload && payload.level !== undefined) {
        set({ riskPulse: payload.level });
      }
    });

    socket.on('system.threatIndex', (payload: any) => {
      if (payload) {
        const raw = payload.score ?? payload.value ?? null;
        if (raw !== null) {
          const normalized = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
          set({ threatIndex: normalized });
        }
      }
    });

    socket.on('velocity.live', (payload: any) => {
      if (payload && payload.currentTps !== undefined) {
        set({ velocity: payload.currentTps });
        window.dispatchEvent(new CustomEvent('velocity:live', { detail: payload }));
      }
    });

    socket.on('alerts.pressure', (payload: any) => {
      if (payload && payload.pressure !== undefined) {
        set({ alertsPressure: payload.pressure });
      }
    });

    socket.on('transactions.live', () => {
      set((state) => ({ transactionCount: state.transactionCount + 1 }));
    });

    socket.on('fraud.alerts', () => {
      set((state) => ({ alertCount: state.alertCount + 1 }));
    });

    set({ listenersAttached: true });
  },

  disconnectLive: () => {
    // We stay connected for HUD persistence
    // We don't detach listeners to avoid complexity, but we don't re-attach them either
  }
}));
