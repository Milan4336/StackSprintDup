import { Alerts as LegacyAlerts } from './Alerts';
import { useAlertsSlice } from '../store/slices/alertsSlice';
import { useEffect } from 'react';

export const AlertsPage = () => {
    const { connectLive, disconnectLive } = useAlertsSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <LegacyAlerts />
        </div>
    );
};
