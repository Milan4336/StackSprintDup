import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../../services/socket';

interface State {
  connected: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useTransactionsSlice = create<State>((set) => ({
  connected: false,

  connectLive: () => {
    const socket = connectSocket();

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('transactions.live', (payload) => {
      window.dispatchEvent(new CustomEvent('transactions:live', { detail: payload }));
    });

    socket.on('system.spike', (payload) => {
      window.dispatchEvent(new CustomEvent('system:spike', { detail: payload }));
    });

    socket.on('risk.distribution.live', (payload) => {
      window.dispatchEvent(new CustomEvent('risk:distribution:live', { detail: payload }));
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
