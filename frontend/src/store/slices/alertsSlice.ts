import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../../services/socket';

interface State {
  connected: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useAlertsSlice = create<State>((set) => ({
  connected: false,

  connectLive: () => {
    const socket = connectSocket();

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('alerts.pressure', (payload) => {
      window.dispatchEvent(new CustomEvent('alerts:pressure', { detail: payload }));
    });

    socket.on('fraud.alerts', (payload) => {
      window.dispatchEvent(new CustomEvent('alerts:new', { detail: payload }));
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
