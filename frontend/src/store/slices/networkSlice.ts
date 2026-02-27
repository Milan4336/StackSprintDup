import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../../services/socket';

interface State {
  connected: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useNetworkSlice = create<State>((set) => ({
  connected: false,

  connectLive: () => {
    const socket = connectSocket();
    
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('collusion.live', (payload) => {
      console.log('Received collusion.live', payload);
      // handle collusion.live
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
