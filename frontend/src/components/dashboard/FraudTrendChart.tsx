import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface FraudTrendChartProps {
  transactions: Transaction[];
}

const tooltipStyle = {
  background: 'rgba(15,23,42,0.94)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: 12,
  color: '#e2e8f0'
};

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
        time: safeDate(bucket)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? 'N/A',
        total: item.total,
        fraud: item.fraud
      }));
  }, [transactions]);

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.09 }}>
      <h3 className="panel-title">Detection Performance</h3>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="app-empty h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400">No fraud trend points available.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="time" stroke="#94a3b8" minTickGap={24} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} dot={false} name="Fraud" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.article>
  );
};
