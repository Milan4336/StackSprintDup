import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FraudExplanationRecord, Transaction } from '../../types';

interface FraudExplanationPanelProps {
  transactions: Transaction[];
  explanations: FraudExplanationRecord[];
}

export const FraudExplanationPanel = ({ transactions, explanations }: FraudExplanationPanelProps) => {
  const selected = useMemo(() => {
    const fromTransaction = transactions.find((tx) => tx.explanations && tx.explanations.length > 0);
    if (fromTransaction?.explanations) {
      return {
        transactionId: fromTransaction.transactionId,
        fraudScore: fromTransaction.fraudScore,
        confidence: fromTransaction.modelConfidence,
        modelScores: fromTransaction.modelScores,
        explanations: fromTransaction.explanations,
        aiExplanation: fromTransaction.aiExplanation
      };
    }

    const recent = explanations[0];
    if (!recent) return null;

    return {
      transactionId: recent.transactionId,
      fraudScore: recent.fraudScore,
      explanations: recent.explanations,
      aiExplanation: recent.aiExplanation
    };
  }, [transactions, explanations]);

  if (!selected) {
    return (
      <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.08 }}>
        <h3 className="panel-title">Explainable AI Panel</h3>
        <p className="rounded-xl border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No explanation payloads available yet.
        </p>
      </motion.article>
    );
  }

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.08 }}>
      <h3 className="panel-title">Explainable AI Panel</h3>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          Transaction {selected.transactionId} · Score {selected.fraudScore}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confidence</span>
          <span className={`flex h-6 items-center px-2 rounded-lg text-[10px] font-bold ring-1 ${(selected.confidence ?? 0) > 0.8 ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/30' :
            (selected.confidence ?? 0) > 0.5 ? 'bg-amber-500/10 text-amber-500 ring-amber-500/30' :
              'bg-slate-500/10 text-slate-400 ring-slate-500/30'
            }`}>
            {Math.round((selected.confidence ?? 0) * 100)}%
          </span>
        </div>
      </div>

      {selected.aiExplanation && (
        <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-600/5 p-4 shadow-sm shadow-blue-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-blue-500" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">AI Risk Narrative</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium italic">
            "{selected.aiExplanation}"
          </p>
        </div>
      )}

      {selected.modelScores && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {Object.entries(selected.modelScores).map(([name, score]) => (
            <div key={name} className="flex flex-col rounded-xl border border-slate-200/50 bg-slate-50/50 p-2 dark:border-slate-800/50 dark:bg-slate-900/40">
              <span className="text-[9px] uppercase tracking-tighter text-slate-400 block truncate">{name.replace('_', ' ')}</span>
              <span className={`text-xs font-mono font-bold ${score > 0.7 ? 'text-red-500' : score > 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {Math.round(score * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 space-y-2">
        {selected.explanations.map((item) => (
          <div key={`${item.feature}-${item.reason}`} className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{item.feature}</span>
              <span>{Math.round(item.impact * 100)}%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.reason}</p>
          </div>
        ))}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={selected.explanations.map((e) => ({ feature: e.feature, impact: e.impact }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="feature" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 1]} />
            <Tooltip formatter={(value: number) => `${Math.round(value * 100)}%`} />
            <Bar dataKey="impact" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
};
