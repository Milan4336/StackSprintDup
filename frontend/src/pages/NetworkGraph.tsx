import { FraudNetwork as LegacyFraudNetwork } from './FraudNetwork';
import { useNetworkSlice } from '../store/slices/networkSlice';
import { useEffect } from 'react';

export const NetworkGraph = () => {
    const { connectLive, disconnectLive } = useNetworkSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <LegacyFraudNetwork />
        </div>
    );
};
