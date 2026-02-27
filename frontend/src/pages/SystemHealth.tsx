import { System as LegacySystem } from './System';
import { useSystemSlice } from '../store/slices/systemSlice';
import { useEffect } from 'react';

export const SystemHealth = () => {
    const { connectLive, disconnectLive } = useSystemSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <LegacySystem />
        </div>
    );
};
