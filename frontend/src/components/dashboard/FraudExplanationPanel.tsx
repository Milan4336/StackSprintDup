import { useMemo } from 'react';
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
        explanations: fromTransaction.explanations
      };
    }

    const recent = explanations[0];
    if (!recent) return null;

    return {
      transactionId: recent.transactionId,
      fraudScore: recent.fraudScore,
      explanations: recent.explanations
    };
  }, [transactions, explanations]);

  if (!selected) {
    return (
      <article className="panel animate-fade-in">
        <h3 className="panel-title">Explainable AI Panel</h3>
        <p className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
          No explanation payloads available yet.
        </p>
      </article>
    );
  }

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Explainable AI Panel</h3>
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-400">
        Transaction {selected.transactionId} · Score {selected.fraudScore}
      </p>

      <div className="mb-4 space-y-2">
        {selected.explanations.map((item) => (
          <div key={`${item.feature}-${item.reason}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-200">
              <span>{item.feature}</span>
              <span>{Math.round(item.impact * 100)}%</span>
            </div>
            <p className="text-xs text-slate-400">{item.reason}</p>
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
    </article>
  );
};
