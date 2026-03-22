import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, getSocket } from '../services/socket';
import { FraudAlert } from '../types';
import { useActivityFeedStore } from '../store/activityFeedStore';
import { useThreatStore } from '../store/threatStore';

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket() ?? connectSocket();

    const onLive = (payload: unknown) => {
      useActivityFeedStore.getState().addSocketEvent('transactions.live', payload);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-query'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['cases'] }),
        queryClient.invalidateQueries({ queryKey: ['model-health'] })
      ]);
    };

    const onAlert = (payload: FraudAlert) => {
      useActivityFeedStore.getState().addSocketEvent('fraud.alerts', payload);
      useThreatStore.getState().ingestAlert(payload);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      ]);
    };

    const onSimulation = (payload: unknown) => {
      useActivityFeedStore.getState().addSocketEvent('simulation.events', payload);
      const event = payload && typeof payload === 'object' ? (payload as { type?: string }) : null;
      if (event?.type?.includes('started')) {
        useThreatStore.getState().setSimulationActive(true);
      } else if (event?.type?.includes('completed')) {
        useThreatStore.getState().setSimulationActive(false);
      }

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions-query'] })
      ]);
    };

    const onSystem = (payload: unknown) => {
      useActivityFeedStore.getState().addSocketEvent('system.status', payload);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-health'] }),
        queryClient.invalidateQueries({ queryKey: ['system-ml-status'] })
      ]);
    };

    socket.on('transactions.live', onLive);
    socket.on('fraud.alerts', onAlert);
    socket.on('simulation.events', onSimulation);
    socket.on('system.status', onSystem);

    return () => {
      socket.off('transactions.live', onLive);
      socket.off('fraud.alerts', onAlert);
      socket.off('simulation.events', onSimulation);
      socket.off('system.status', onSystem);
    };
  }, [queryClient]);
};
