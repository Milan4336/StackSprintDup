import { Transaction } from '../../types';

interface RiskHeatmapProps {
  transactions: Transaction[];
}

const scoreColor = (score: number): string => {
  const clamped = Math.max(0, Math.min(100, score));
  const hue = ((100 - clamped) / 100) * 120;
  return `hsl(${hue}, 75%, 50%)`;
};

export const RiskHeatmap = ({ transactions }: RiskHeatmapProps) => {
  const points = transactions.slice(0, 84);

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Risk Heatmap Visualization</h3>
      {points.length === 0 ? (
        <p className="rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-400">No transactions available.</p>
      ) : (
        <div className="grid grid-cols-7 gap-2 sm:grid-cols-12">
          {points.map((tx) => (
            <div
              key={tx.transactionId}
              className="h-7 rounded-md transition duration-300 hover:scale-110"
              style={{ backgroundColor: scoreColor(tx.fraudScore) }}
              title={`${tx.transactionId} · Score ${tx.fraudScore} · ${tx.riskLevel}`}
            />
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Low Risk</span>
        <div className="h-2 w-56 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
        <span>High Risk</span>
      </div>
    </article>
  );
};
