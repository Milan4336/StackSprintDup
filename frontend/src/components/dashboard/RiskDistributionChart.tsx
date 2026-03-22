import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';

interface RiskDistributionChartProps {
  transactions: Transaction[];
}

export const RiskDistributionChart = ({ transactions }: RiskDistributionChartProps) => {
  const data = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    for (const tx of transactions) {
      counts[tx.riskLevel] += 1;
    }
    return [
      { risk: 'Low', count: counts.Low, fill: '#22c55e' },
      { risk: 'Medium', count: counts.Medium, fill: '#f59e0b' },
      { risk: 'High', count: counts.High, fill: '#ef4444' }
    ];
  }, [transactions]);

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Risk Score Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
            <XAxis dataKey="risk" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.risk} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};
