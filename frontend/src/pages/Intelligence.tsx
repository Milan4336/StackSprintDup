import { useEffect, useState } from 'react';
import { useIntelligenceSlice } from '../store/slices/intelligenceSlice';
import { BrainCircuit, LineChart, Target, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Intelligence = () => {
    const { connectLive, disconnectLive } = useIntelligenceSlice();

    // Dummy state until socket events are fully flowing
    const [confidence, setConfidence] = useState(94.2);
    const [klDivergence, setKlDivergence] = useState(0.04);

    useEffect(() => {
        connectLive();

        const sim = setInterval(() => {
            setConfidence(prev => Math.min(100, Math.max(80, prev + (Math.random() * 2 - 1))));
            setKlDivergence(prev => Math.max(0, prev + (Math.random() * 0.02 - 0.01)));
        }, 3000);

        return () => {
            clearInterval(sim);
            disconnectLive();
        };
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Intelligence & ML Ops</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Live ensemble model monitoring, behavioral drift, and risk forecasting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <BrainCircuit className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Ensemble Confidence</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">{confidence.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-emerald-400 mb-1">Optimal</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500"
                            animate={{ width: `${confidence}%` }}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-orange-500/20 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Target className="text-orange-400" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">KL Divergence (Drift)</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">{klDivergence.toFixed(3)}</span>
                        <span className="text-sm font-bold text-slate-500 mb-1">Threshold: 0.1</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <motion.div
                            className={`h-full ${klDivergence > 0.08 ? 'bg-red-500' : 'bg-orange-500'}`}
                            animate={{ width: `${Math.min(100, (klDivergence / 0.1) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <LineChart className="text-blue-400" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Risk Forecast Projection</h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Chart Rendering...</span>
                    </div>
                </div>

                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertOctagon className="text-emerald-400" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">False Positive Monitor</h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Analytics Rendering...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
