import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../../services/socket';

interface State {
  connected: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useActionsSlice = create<State>((set) => ({
  connected: false,

  connectLive: () => {
    const socket = connectSocket();
    
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));


  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
