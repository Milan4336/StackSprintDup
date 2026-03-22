import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../../services/socket';

interface State {
  connected: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useIntelligenceSlice = create<State>((set) => ({
  connected: false,

  connectLive: () => {
    const socket = connectSocket();

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('system.modelConfidence', (payload) => {
      // console.log('Received system.modelConfidence', payload);
      window.dispatchEvent(new CustomEvent('intelligence:confidence', { detail: payload }));
    });

    socket.on('risk.forecast', (payload) => {
      window.dispatchEvent(new CustomEvent('intelligence:riskForecast', { detail: payload }));
    });

    socket.on('drift.live', (payload) => {
      // console.log('Received drift.live', payload);
      window.dispatchEvent(new CustomEvent('intelligence:drift', { detail: payload }));
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
