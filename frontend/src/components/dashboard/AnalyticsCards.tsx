import { memo, useMemo } from 'react';
import { Transaction, TransactionStats } from '../../types';

interface AnalyticsCardsProps {
  transactions: Transaction[];
  stats: TransactionStats | null;
}

const cardStyle =
  'group rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-xl';

export const AnalyticsCards = memo(({ transactions, stats }: AnalyticsCardsProps) => {
  const cards = useMemo(() => {
    const totalTransactions = transactions.length;
    const fraudCount = transactions.filter((t) => t.isFraud).length;
    const fraudRate = stats?.fraudRate ?? (totalTransactions ? fraudCount / totalTransactions : 0);
    const avgRisk =
      stats?.avgRiskScore ??
      (totalTransactions ? transactions.reduce((sum, tx) => sum + tx.fraudScore, 0) / totalTransactions : 0);

    return [
      {
        label: 'Total Transactions',
        value: totalTransactions.toLocaleString(),
        tone: 'text-blue-300',
        icon: '◈'
      },
      {
        label: 'Fraud Transactions',
        value: fraudCount.toLocaleString(),
        tone: 'text-red-300',
        icon: '⚠'
      },
      {
        label: 'Fraud Rate',
        value: `${(fraudRate * 100).toFixed(2)}%`,
        tone: 'text-amber-300',
        icon: '◎'
      },
      {
        label: 'Average Risk Score',
        value: avgRisk.toFixed(1),
        tone: 'text-emerald-300',
        icon: '▣'
      }
    ];
  }, [transactions, stats]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in">
      {cards.map((card) => (
        <article key={card.label} className={cardStyle}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <span className="text-lg text-slate-500 transition group-hover:text-slate-300">{card.icon}</span>
          </div>
          <p className={`text-3xl font-extrabold tracking-tight ${card.tone}`}>{card.value}</p>
        </article>
      ))}
    </section>
  );
});
