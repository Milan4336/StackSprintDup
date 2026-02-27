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
      console.log('Received system.modelConfidence', payload);
      // handle system.modelConfidence
    });

    socket.on('risk.forecast', (payload) => {
      console.log('Received risk.forecast', payload);
      // handle risk.forecast
    });

    socket.on('drift.live', (payload) => {
      console.log('Received drift.live', payload);
      // handle drift.live
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
