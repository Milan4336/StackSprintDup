import { useEffect } from 'react';
import { useDevicesSlice } from '../store/slices/devicesSlice';
import { Smartphone, Laptop, AlertTriangle } from 'lucide-react';

export const Devices = () => {
    const { connectLive, disconnectLive } = useDevicesSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Device Fingerprints</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Hardware reputation tracking and shared origin connections.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-96">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Suspicious Device Leaderboard</h3>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 modern-scrollbar">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {i % 2 === 0 ? <Smartphone className="text-slate-400" size={16} /> : <Laptop className="text-slate-400" size={16} />}
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">Device_Hash_{i}a8f...9c</p>
                                        <p className="text-[10px] text-slate-500">Connected to {2 + i} suspected accounts</p>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] uppercase font-black tracking-widest rounded">
                                    High Risk
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-96">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Device Reputation Engine</h3>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <AlertTriangle className="text-slate-600 mb-4" size={48} />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-500">Reputation Model Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
