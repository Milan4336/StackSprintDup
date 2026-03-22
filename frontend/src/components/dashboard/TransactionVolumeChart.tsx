import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface TransactionVolumeChartProps {
  transactions: Transaction[];
}

const tooltipStyle = {
  background: 'rgba(15,23,42,0.94)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: 12,
  color: '#e2e8f0'
};

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
        time: safeDate(key)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? 'N/A',
        count
      }));
  }, [transactions]);

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }}>
      <h3 className="panel-title">Transaction Volume</h3>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="app-empty h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400">No transaction volume data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="time" stroke="#94a3b8" minTickGap={24} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[9, 9, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.article>
  );
});
