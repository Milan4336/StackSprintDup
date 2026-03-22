import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface TransactionTimeSeriesProps {
  transactions: Transaction[];
}

export const TransactionTimeSeries = ({ transactions }: TransactionTimeSeriesProps) => {
  const data = useMemo(() => {
    const bucket = new Map<string, number>();

    for (const tx of transactions) {
      const date = safeDate(tx.timestamp);
      if (!date) continue;
      date.setMinutes(0, 0, 0);
      const key = date.toISOString();
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }

    return Array.from(bucket.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-18)
      .map(([iso, count]) => ({
        time: safeDate(iso)?.toLocaleString() ?? 'N/A',
        count
      }));
  }, [transactions]);

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Transaction Volume Over Time</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" minTickGap={24} />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#93c5fd' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};
