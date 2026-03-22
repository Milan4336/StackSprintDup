import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { ThreatLevel, useThreatStore } from '../../store/threatStore';

const toneByLevel: Record<ThreatLevel, string> = {
  NORMAL: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  SUSPICIOUS: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  HIGH: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  CRITICAL: 'border-red-500/30 bg-red-500/10 text-red-200'
};

export const ThreatStatusCard = () => {
  const threatLevel = useThreatStore((state) => state.threatLevel);
  const reason = useThreatStore((state) => state.reason);
  const recentHighRiskCount = useThreatStore((state) => state.recentHighRiskCount);
  const fraudRate = useThreatStore((state) => state.fraudRate);
  const mlStatus = useThreatStore((state) => state.mlStatus);
  const simulationActive = useThreatStore((state) => state.simulationActive);

  return (
    <motion.article
      className="panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="panel-title mb-0">Current System Threat Level</h3>
        <ShieldAlert size={16} className={threatLevel === 'CRITICAL' ? 'text-red-300' : 'text-slate-300'} />
      </div>

      <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${toneByLevel[threatLevel]}`}>
        {threatLevel}
      </div>

      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{reason}</p>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <p className="rounded-lg border border-slate-300/70 bg-white/60 px-2 py-1.5 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200">
          High-risk alerts (5m): <span className="font-semibold">{recentHighRiskCount}</span>
        </p>
        <p className="rounded-lg border border-slate-300/70 bg-white/60 px-2 py-1.5 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200">
          Fraud rate: <span className="font-semibold">{fraudRate.toFixed(1)}%</span>
        </p>
        <p className="rounded-lg border border-slate-300/70 bg-white/60 px-2 py-1.5 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200">
          ML status: <span className="font-semibold">{mlStatus}</span>
        </p>
        <p className="rounded-lg border border-slate-300/70 bg-white/60 px-2 py-1.5 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200">
          Simulation active: <span className="font-semibold">{simulationActive ? 'Yes' : 'No'}</span>
        </p>
      </div>
    </motion.article>
  );
};

