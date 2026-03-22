import { memo, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface TransactionVolumeChartProps {
  transactions: Transaction[];
}

export const TransactionVolumeChart = memo(({ transactions }: TransactionVolumeChartProps) => {
  const data = useMemo(() => {
    const groups = new Map<string, number>();
    transactions.forEach((tx) => {
      const date = safeDate(tx.timestamp);
      if (!date) return;
      const key = date.toISOString().slice(0, 13);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-20)
      .map(([key, count]) => ({
        time: safeDate(key)?.toLocaleString() ?? 'N/A',
        count
      }));
  }, [transactions]);

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Transaction Volume Analysis</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" minTickGap={28} />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
});
