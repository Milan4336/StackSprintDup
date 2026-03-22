import { create } from 'zustand';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket';

interface ActionEvent {
  id: string;
  type: string;
  userId: string;
  reason: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
  action: string;
}

interface State {
  connected: boolean;
  actions: ActionEvent[];
  listenersAttached: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useActionsSlice = create<State>((set, get) => ({
  connected: false,
  actions: [],
  listenersAttached: false,

  connectLive: () => {
    const socket = connectSocket();
    set({ connected: socket.connected });

    if (get().listenersAttached) return;

    socket.on('connect', () => {
      console.log('Actions socket connected');
      set({ connected: true });
    });

    socket.on('connect_error', (error) => {
      console.error('Actions socket connection error:', error);
      set({ connected: false });
    });

    socket.on('disconnect', (reason) => {
      console.log('Actions socket disconnected:', reason);
      set({ connected: false });
    });

    socket.on('system.status', (payload: any) => {
      if (payload?.status === 'connected') {
        set({ connected: true });
      }
    });

    socket.on('transactions.live', (payload: any) => {
      const action = payload.action;
      if (!action || action === 'ALLOW') return;

      const fraudScore = Number(payload.fraudScore ?? 0);
      const event: ActionEvent = {
        id: String(payload.transactionId ?? `tx-${Date.now()}`),
        type: action,
        userId: String(payload.userId ?? 'unknown'),
        reason: Array.isArray(payload.ruleReasons) && payload.ruleReasons.length > 0
          ? String(payload.ruleReasons[0])
          : `Fraud score ${fraudScore.toFixed(0)} exceeded threshold`,
        severity: fraudScore >= 80 ? 'critical' : fraudScore >= 50 ? 'high' : 'medium',
        timestamp: String(payload.timestamp ?? new Date().toISOString()),
        action,
      };

      set(state => ({
        actions: [event, ...state.actions].slice(0, 50)
      }));
    });

    socket.on('fraud.alerts', (payload: any) => {
      const event: ActionEvent = {
        id: String(payload.id ?? `alert-${Date.now()}`),
        type: 'FRAUD_ALERT',
        userId: String(payload.userId ?? 'unknown'),
        reason: String(payload.reason ?? 'Fraud pattern detected'),
        severity: 'critical',
        timestamp: String(payload.timestamp ?? new Date().toISOString()),
        action: 'BLOCK',
      };
      set(state => ({
        actions: [event, ...state.actions].slice(0, 50)
      }));
    });

    set({ listenersAttached: true });
  },

  disconnectLive: () => {
    // We stay connected for HUD persistence
  }
}));
