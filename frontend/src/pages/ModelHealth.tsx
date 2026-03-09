import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  Area,
  AreaChart,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCcw,
  ShieldCheck,
  History,
  Zap,
  Activity,
  BarChart4,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mt-1">
            <span className="text-xs font-medium text-slate-300">{entry.name}:</span>
            <span className="text-xs font-mono font-bold" style={{ color: entry.color || entry.fill }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ModelHealth = () => {
  const queryClient = useQueryClient();
  const [retraining, setRetraining] = useState(false);

  const modelInfoQuery = useQuery({
    queryKey: ['model-info'],
    queryFn: () => monitoringApi.getModelInfo(),
    refetchInterval: 10000
  });

  const modelHealthQuery = useQuery({
    queryKey: ['model-health'],
    queryFn: () => monitoringApi.getModelHealth(120),
    refetchInterval: 10000
  });

  const modelRegistryQuery = useQuery({
    queryKey: ['model-registry', 'xgboost'],
    queryFn: () => monitoringApi.getModelRegistry('xgboost'),
    refetchInterval: 30000
  });

  const modelStatsQuery = useQuery({
    queryKey: ['model-stats'],
    queryFn: () => monitoringApi.getModelStats(),
    refetchInterval: 10000
  });

  const retrainMutation = useMutation({
    mutationFn: () => monitoringApi.retrainModel(),
    onSuccess: () => {
      setRetraining(true);
      setTimeout(() => setRetraining(false), 5000);
      queryClient.invalidateQueries({ queryKey: ['model-info'] });
      queryClient.invalidateQueries({ queryKey: ['model-stats'] });
    }
  });

  const trendData = useMemo(
    () =>
      (modelHealthQuery.data?.metrics ?? [])
        .slice()
        .reverse()
        .map((item) => ({
          time: formatSafeDate(item.snapshotAt),
          fraudRate: Number((item.fraudRate * 100).toFixed(2)),
          avgScore: Number(item.avgFraudScore.toFixed(2))
        })),
    [modelHealthQuery.data]
  );

  const registryData = useMemo(
    () =>
      (modelRegistryQuery.data ?? [])
        .slice()
        .reverse()
        .map((item: any) => ({
          version: item.version,
          auc: item.metrics?.auc || 0,
          precision: item.metrics?.precision || 0,
          recall: item.metrics?.recall || 0,
        })),
    [modelRegistryQuery.data]
  );

  const latest = modelHealthQuery.data?.latest ?? null;
  const deployment = modelStatsQuery.data ?? { active: {}, candidate: null };

  const weightData = useMemo(() => {
    if (!modelInfoQuery.data?.ensemble.weights) return [];
    return Object.entries(modelInfoQuery.data.ensemble.weights).map(([name, weight]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value: weight,
      color: name === 'xgboost' ? '#3b82f6' : name === 'isolation_forest' ? '#8b5cf6' : '#ec4899'
    }));
  }, [modelInfoQuery.data]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 italic tracking-tight uppercase">Adaptive ML Pipeline</h2>
            <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest">v3.1.0</div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Self-optimizing fraud detection with automated blue-green retraining</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => retrainMutation.mutate()}
            disabled={retrainMutation.isPending || retraining}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={14} className={retrainMutation.isPending || retraining ? 'animate-spin' : ''} />
            {retraining ? 'RETRAIN TRIGGERED' : 'MANUAL RETRAIN'}
          </button>
        </div>
      </header>

      {/* ── Pipeline Multi-Panel ─────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Registry Performance History */}
        <article className="panel xl:col-span-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="panel-title flex items-center gap-2 m-0">
              <History size={18} className="text-blue-500" />
              Retraining Performance History
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> AUC
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> PRECISION
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> RECALL
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registryData}>
                <defs>
                  <linearGradient id="colorAuc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                <XAxis dataKey="version" stroke="#64748b" fontSize={9} interval="preserveStartEnd" />
                <YAxis stroke="#64748b" fontSize={9} domain={[0, 1]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="AUC" dataKey="auc" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAuc)" />
                <Line type="monotone" name="Precision" dataKey="precision" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" name="Recall" dataKey="recall" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Blue-Green Status */}
        <article className="panel xl:col-span-4 flex flex-col">
          <h3 className="panel-title flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Deployment Pipeline
          </h3>
          <div className="flex-1 space-y-4 mt-2">
            {/* Active Model */}
            <div className="relative p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Active Model
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">{deployment.active.version}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">XGBoost-L4</p>
                  <p className="text-[10px] text-slate-500 font-medium">Production Traffic: 100%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-500">AUC: {deployment.active.metrics?.auc?.toFixed(4) || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Connection Wire */}
            <div className="flex justify-center h-4 py-1">
              <div className="w-0.5 bg-slate-800" />
            </div>

            {/* Candidate Model */}
            <div className={`relative p-4 rounded-xl border ${deployment.candidate ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-900/50 border-slate-800 border-dashed'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${deployment.candidate ? 'text-blue-500' : 'text-slate-600'}`}>
                  <Activity size={12} /> {deployment.candidate ? 'Candidate Ready' : 'Standby'}
                </span>
                {deployment.candidate && <span className="text-[10px] font-mono font-bold text-slate-500">{deployment.candidate.version}</span>}
              </div>
              {deployment.candidate ? (
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">XGBoost-L5</p>
                    <p className="text-[10px] text-slate-500 font-medium italic">Pending Verification Pass</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-500">AUC: {deployment.candidate.metrics?.auc?.toFixed(4)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter italic">Awaiting next retraining cycle</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 px-1">
                <span>REVALIDATION PROGRESS</span>
                <span>85%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: deployment.candidate ? '100%' : '85%' }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ── Status Bar & Drift ────────────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-4">
        {/* Drift Indicator */}
        <article className="panel p-5 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Zap size={20} />
            </div>
            {!latest?.driftDetected ? (
              <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-black">HEALTHY</div>
            ) : (
              <div className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-black">DRIFTING</div>
            )}
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Model Drift Index</h4>
            <p className="text-2xl font-black text-slate-100">0.024</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight size={12} /> -0.002 vs last cycle
            </div>
          </div>
        </article>

        {/* Retraining Cron */}
        <article className="panel p-5 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Database size={20} />
            </div>
            <div className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[10px] font-black italic">SCHEDULED</div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Retraining Run</h4>
            <p className="text-xl font-black text-slate-100">Daily at 00:00</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1">Target Window: Last 30 Days Data</p>
          </div>
        </article>

        {/* Training Set Size */}
        <article className="panel p-5 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <BarChart4 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Training Set Size</h4>
            <p className="text-2xl font-black text-slate-100">2,000</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1 italic">Labeled transaction pool</p>
          </div>
        </article>

        {/* Validation Pass Rate */}
        <article className="panel p-5 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg. AUC Gain</h4>
            <p className="text-2xl font-black text-slate-100">+4.2%</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-1">
              Last 5 iterations
            </div>
          </div>
        </article>
      </section>

      {/* ── Ensemble Weight Management (Legacy) ───────────────── */}
      <section className="grid gap-6 xl:grid-cols-12">
        <article className="panel xl:col-span-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="panel-title flex items-center gap-2 m-0">
              <盾牌Check size={18} className="text-blue-500" />
              Real-time Inference Distribution
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={weightData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {weightData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="md:col-span-2 space-y-4">
              {weightData.map((w) => (
                <div key={w.name} className="relative p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-blue-500/5 transition-all" style={{ width: `${w.value * 100}%` }} />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 text-xs font-black" style={{ color: w.color }}>
                        {w.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-300 tracking-widest">{w.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold">Consensus Contribution</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black font-mono text-slate-100">{(w.value * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

// Fix for ShieldCheck import
function 盾牌Check(props: any) {
  return <ShieldCheck {...props} />;
}
