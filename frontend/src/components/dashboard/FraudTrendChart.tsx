import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface FraudTrendChartProps {
  transactions: Transaction[];
}

export const FraudTrendChart = ({ transactions }: FraudTrendChartProps) => {
  const data = useMemo(() => {
    const grouped = new Map<string, { total: number; fraud: number }>();

    transactions.forEach((tx) => {
      const date = safeDate(tx.timestamp);
      if (!date) return;
      const bucket = date.toISOString().slice(0, 13);
      const item = grouped.get(bucket) ?? { total: 0, fraud: 0 };
      item.total += 1;
      if (tx.isFraud) item.fraud += 1;
      grouped.set(bucket, item);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-30)
      .map(([bucket, item]) => ({
        time: safeDate(bucket)?.toLocaleString() ?? 'N/A',
        total: item.total,
        fraud: item.fraud
      }));
  }, [transactions]);

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Fraud Trend Over Time</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" minTickGap={28} />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
            <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} dot={false} name="Fraud" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};
