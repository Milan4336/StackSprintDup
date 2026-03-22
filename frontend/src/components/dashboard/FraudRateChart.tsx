import { memo, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface FraudRateChartProps {
  transactions: Transaction[];
}

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
        time: safeDate(key)?.toLocaleString() ?? 'N/A',
        fraudRate: value.total ? Number(((value.fraud / value.total) * 100).toFixed(2)) : 0
      }));
  }, [transactions]);

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Fraud Rate Trend</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fraudRateFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" minTickGap={28} />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Area dataKey="fraudRate" stroke="#ef4444" fill="url(#fraudRateFill)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
});
