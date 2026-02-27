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
      console.log('Received transactions.live', payload);
      // handle transactions.live
    });

    socket.on('system.spike', (payload) => {
      console.log('Received system.spike', payload);
      // handle system.spike
    });

    socket.on('risk.distribution.live', (payload) => {
      console.log('Received risk.distribution.live', payload);
      // handle risk.distribution.live
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
