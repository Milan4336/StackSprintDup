import { Simulation as LegacySimulation } from './Simulation';
import { useSystemSlice } from '../store/slices/systemSlice';
import { useEffect } from 'react';

export const Simulation = () => {
    // We reuse the system slice for now since simulation events are system-wide
    const { connectLive, disconnectLive } = useSystemSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <LegacySimulation />
        </div>
    );
};
