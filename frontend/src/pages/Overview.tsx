import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { useDashboardOverviewSlice } from '../store/slices/dashboardOverviewSlice';
import { motion, AnimatePresence } from 'framer-motion';

export const Overview = () => {
    const { connectLive, disconnectLive } = useDashboardOverviewSlice();

    // Local dummy state until backend is fully hooked up to respond to socket emissions
    const [threatIndex, setThreatIndex] = useState(42);
    const [riskPulse, setRiskPulse] = useState(38);
    const [velocity, setVelocity] = useState(124);

    useEffect(() => {
        connectLive();

        // Simulate live updates for UI before full socket payload mapping is done
        const interval = setInterval(() => {
            setThreatIndex(prev => Math.max(0, Math.min(100, prev + (Math.random() * 6 - 3))));
            setRiskPulse(prev => Math.max(0, Math.min(100, prev + (Math.random() * 10 - 5))));
            setVelocity(prev => Math.max(0, prev + (Math.random() * 20 - 10)));
        }, 2500);

        return () => {
            clearInterval(interval);
            disconnectLive();
        };
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Executive Overview</h1>
                    <p className="text-sm font-bold text-slate-400 mt-1">High-level threat intelligence and system metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* KPI: Threat Index */}
                <div className="rounded-2xl border border-red-500/20 bg-slate-900/50 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle size={80} className="text-red-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="text-red-500" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Threat Index</h3>
                        </div>
                        <div className="mt-4 flex items-end gap-3">
                            <span className="text-5xl font-black text-white">{threatIndex.toFixed(1)}</span>
                            <span className="text-sm font-bold text-red-400 mb-1">Critical</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                animate={{ width: `${threatIndex}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </div>
                </div>

                {/* KPI: Risk Pulse */}
                <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={80} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Activity className="text-blue-500" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Global Risk Pulse</h3>
                        </div>
                        <div className="mt-4 flex items-end gap-3">
                            <span className="text-5xl font-black text-white">{riskPulse.toFixed(1)}</span>
                            <span className="text-sm font-bold text-blue-400 mb-1">/ 100</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-500"
                                animate={{ width: `${riskPulse}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </div>
                </div>

                {/* KPI: Formatted Velocity */}
                <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/50 p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Zap className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Tx Velocity</h3>
                        </div>
                        <div className="mt-4 flex items-end gap-3">
                            <span className="text-5xl font-black text-white">{Math.round(velocity)}</span>
                            <span className="text-sm font-bold text-indigo-400 mb-1">TPS</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-4">+12% from 1hr avg</p>
                    </div>
                </div>

                {/* KPI: Defense Status */}
                <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-6 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ShieldAlert className="text-emerald-400" size={20} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Defense Status</h3>
                    </div>
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-slate-400 flex items-center gap-2"><Cpu size={14} /> ML Ensemble</span>
                            <span className="text-emerald-400">Operational</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-slate-400 flex items-center gap-2"><Activity size={14} /> Circuit Breaker</span>
                            <span className="text-emerald-400">Closed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for larger charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-center">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-500">Live Transaction Velocity Chart Rendering...</span>
                </div>
                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-center">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-500">Impact Estimator Rendering...</span>
                </div>
            </div>
        </div>
    );
};
