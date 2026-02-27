import { useEffect } from 'react';
import { useActionsSlice } from '../store/slices/actionsSlice';
import { ShieldAlert, Bot } from 'lucide-react';

export const AutonomousActions = () => {
    const { connectLive, disconnectLive } = useActionsSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Autonomous Actions</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Live feed of AI-driven system responses, auto-freezes, and blocks.</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-6 flex flex-col h-[600px]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Bot className="text-emerald-400" size={20} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Response Stream Feed</h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="text-slate-600 mb-4" size={48} />
                    <span className="text-sm font-black uppercase tracking-widest text-slate-500">Connecting to Autonomous Engine Stream...</span>
                </div>
            </div>
        </div>
    );
};
