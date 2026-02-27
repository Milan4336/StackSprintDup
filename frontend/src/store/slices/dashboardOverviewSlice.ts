import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../../services/socket';

interface State {
  connected: boolean;
  connectLive: () => void;
  disconnectLive: () => void;
}

export const useDashboardOverviewSlice = create<State>((set) => ({
  connected: false,

  connectLive: () => {
    const socket = connectSocket();
    
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('system.riskPulse', (payload) => {
      console.log('Received system.riskPulse', payload);
      // handle system.riskPulse
    });

    socket.on('system.threatIndex', (payload) => {
      console.log('Received system.threatIndex', payload);
      // handle system.threatIndex
    });

    socket.on('velocity.live', (payload) => {
      console.log('Received velocity.live', payload);
      // handle velocity.live
    });

    socket.on('alerts.pressure', (payload) => {
      console.log('Received alerts.pressure', payload);
      // handle alerts.pressure
    });
  },

  disconnectLive: () => {
    disconnectSocket();
    set({ connected: false });
  }
}));
