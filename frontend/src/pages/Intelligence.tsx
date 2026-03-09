import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIntelligenceSlice } from '../store/slices/intelligenceSlice';
import { BrainCircuit, LineChart, Target, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { ModelConfidenceChart } from '../components/intelligence/ModelConfidenceChart';
import { ModelDriftChart } from '../components/intelligence/ModelDriftChart';

import { ModelConfidenceRing } from '../components/visual/ModelConfidenceRing';
import { FeatureImportanceChart } from '../components/intelligence/FeatureImportanceChart';
import { ContributionBars } from '../components/intelligence/ContributionBars';
import { FeatureContribution } from '../types';

export const Intelligence = () => {
    const { connectLive, disconnectLive } = useIntelligenceSlice();

    // Query historical baseline to bootstrap charts before socket takes over
    const confidenceQuery = useQuery({
        queryKey: ['model-confidence-historical'],
        queryFn: () => monitoringApi.getDashboardModelConfidence(),
        staleTime: Infinity
    });

    const driftQuery = useQuery({
        queryKey: ['model-drift-historical'],
        queryFn: () => monitoringApi.getDashboardDrift(),
        staleTime: Infinity
    });

    // Initial state updated from historical queries or socket
    const [confidence, setConfidence] = useState(0);
    const [klDivergence, setKlDivergence] = useState(0);
    const [lastContributions, setLastContributions] = useState<FeatureContribution[]>([]);

    useEffect(() => {
        connectLive();

        const handleConf = (e: any) => setConfidence(e.detail.confidence);
        const handleDrift = (e: any) => setKlDivergence(e.detail.klDivergence);
        const handlePredict = (e: any) => {
            if (e.detail.featureContributions) {
                setLastContributions(e.detail.featureContributions);
            }
        };

        window.addEventListener('intelligence:confidence', handleConf);
        window.addEventListener('intelligence:drift', handleDrift);
        window.addEventListener('transactions:predict', handlePredict);

        return () => {
            window.removeEventListener('intelligence:confidence', handleConf);
            window.removeEventListener('intelligence:drift', handleDrift);
            window.removeEventListener('transactions:predict', handlePredict);
            disconnectLive();
        };
    }, [connectLive, disconnectLive]);

    useEffect(() => {
        if (confidenceQuery.data && confidenceQuery.data.length > 0) {
            setConfidence(confidenceQuery.data[confidenceQuery.data.length - 1].value);
        }
    }, [confidenceQuery.data]);

    useEffect(() => {
        if (driftQuery.data && driftQuery.data.length > 0) {
            setKlDivergence(driftQuery.data[driftQuery.data.length - 1].value);
        }
    }, [driftQuery.data]);

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
                    <div className="flex flex-col items-center justify-center py-4">
                        <ModelConfidenceRing confidence={confidence} size={140} />
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

                <div className="rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <AlertOctagon className="text-blue-400" size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Explainable AI (SHAP) — Real-time Feature Contribution</h3>
                        </div>
                    </div>
                    {lastContributions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Prediction Baseline Shift</p>
                                <ContributionBars contributions={lastContributions} />
                            </div>
                            <div className="h-48">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 text-center">Relative Feature Importance</p>
                                <FeatureImportanceChart data={lastContributions} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-xl">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Awaiting live prediction data...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <LineChart className="text-blue-400" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Risk Forecast Projection</h3>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                        {confidenceQuery.isLoading ? (
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest absolute inset-0 flex items-center justify-center">Loading Data...</span>
                        ) : confidenceQuery.data ? (
                            <ModelConfidenceChart initialData={confidenceQuery.data} />
                        ) : null}
                    </div>
                </div>

                <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="text-orange-400" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Model Drift (KL Divergence) Tracker</h3>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden relative">
                        {driftQuery.isLoading ? (
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest absolute inset-0 flex items-center justify-center">Loading Analytics...</span>
                        ) : driftQuery.data ? (
                            <ModelDriftChart initialData={driftQuery.data} />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
