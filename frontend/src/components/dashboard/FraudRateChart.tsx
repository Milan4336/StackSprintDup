import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface FraudRateChartProps {
  transactions: Transaction[];
}

const tooltipStyle = {
  background: 'rgba(15,23,42,0.94)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: 12,
  color: '#e2e8f0'
};

export const FraudRateChart = memo(({ transactions }: FraudRateChartProps) => {
  const data = useMemo(() => {
    const groups = new Map<string, { total: number; fraud: number }>();

    transactions.forEach((tx) => {
      const date = safeDate(tx.timestamp);
      if (!date) return;
      const key = date.toISOString().slice(0, 13);
      const prev = groups.get(key) ?? { total: 0, fraud: 0 };
      prev.total += 1;
      if (tx.isFraud) prev.fraud += 1;
      groups.set(key, prev);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-20)
      .map(([key, value]) => ({
        time: safeDate(key)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? 'N/A',
        fraudRate: value.total ? Number(((value.fraud / value.total) * 100).toFixed(2)) : 0
      }));
  }, [transactions]);

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h3 className="panel-title">Fraud Trend Line</h3>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="app-empty h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400">No chart data yet. Create or simulate transactions.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fraudRateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.82} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="time" stroke="#94a3b8" minTickGap={20} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={tooltipStyle}
                cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '2 2' }}
              />
              <Area dataKey="fraudRate" stroke="#ef4444" fill="url(#fraudRateFill)" strokeWidth={2.6} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.article>
  );
});
