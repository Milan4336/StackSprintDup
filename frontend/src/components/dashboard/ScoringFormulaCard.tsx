import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BrainCircuit, Cpu, Network, ShieldCheck } from 'lucide-react';
import { monitoringApi } from '../../api/client';

export const ScoringFormulaCard = () => {
    const { data: settings, isLoading } = useQuery({
        queryKey: ['system-settings'],
        queryFn: () => monitoringApi.getSettings(),
    });

    if (isLoading || !settings) return <div className="skeleton h-48" />;

    const layers = [
        {
            label: 'Expert Rules',
            weight: settings.scoreRuleWeight,
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            description: 'Hardcoded risk logic and velocity checks'
        },
        {
            label: 'ML Ensemble',
            weight: settings.scoreMlWeight,
            icon: Cpu,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            description: 'XGBoost + Autoencoder + Isolation Forest'
        },
        {
            label: 'Behavioral Bias',
            weight: settings.scoreBehaviorWeight,
            icon: BrainCircuit,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            description: 'Baseline deviation and anomaly profiling'
        },
        {
            label: 'Graph Relation',
            weight: settings.scoreGraphWeight,
            icon: Network,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            description: 'User-Device Linkage & Forensic Rings'
        },
    ];

    return (
        <motion.article
            className="panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <div className="mb-6">
                <h3 className="panel-title mb-1 uppercase tracking-widest text-[11px] font-black text-slate-400">Intelligence Orchestration</h3>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Current Fraud Scoring Weights</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {layers.map((layer, i) => (
                    <div key={layer.label} className={`relative overflow-hidden rounded-2xl border border-slate-200/50 p-4 dark:border-slate-800/50 ${layer.bg}`}>
                        <div className="mb-4 flex items-center justify-between">
                            <layer.icon size={20} className={layer.color} />
                            <span className={`text-2xl font-black ${layer.color}`}>{(layer.weight * 100).toFixed(0)}%</span>
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-1">
                            {layer.label}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-500 leading-tight">
                            {layer.description}
                        </p>

                        {/* Visual progress bar */}
                        <div className="mt-3 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                            <motion.div
                                className={`h-full rounded-full ${layer.color.replace('text-', 'bg-')}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${layer.weight * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dynamic Risk Matrix Synchronized</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 italic">
                    Scoring Formula: Σ ( Layer_i * Weight_i )
                </p>
            </div>
        </motion.article>
    );
};
