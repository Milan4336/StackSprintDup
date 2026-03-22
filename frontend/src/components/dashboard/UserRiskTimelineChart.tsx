import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../../types';
import { safeDate } from '../../utils/date';

interface UserRiskTimelineChartProps {
  transactions: Transaction[];
}

export const UserRiskTimelineChart = ({ transactions }: UserRiskTimelineChartProps) => {
  const data = useMemo(() => {
    const selectedUsers = Array.from(
      new Set(
        transactions
          .slice(0, 120)
          .sort((a, b) => b.fraudScore - a.fraudScore)
          .slice(0, 3)
          .map((tx) => tx.userId)
      )
    );

    const grouped = new Map<string, Record<string, number | string>>();

    transactions.slice(0, 220).forEach((tx) => {
      if (!selectedUsers.includes(tx.userId)) return;
      const date = safeDate(tx.timestamp);
      if (!date) return;

      const key = date.toISOString().slice(0, 16);
      const item = grouped.get(key) ?? {
        time: date.toLocaleTimeString()
      };

      item[tx.userId] = tx.fraudScore;
      grouped.set(key, item);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-30)
      .map(([, value]) => value);
  }, [transactions]);

  const users = useMemo(
    () =>
      Array.from(
        new Set(
          transactions
            .slice(0, 120)
            .sort((a, b) => b.fraudScore - a.fraudScore)
            .slice(0, 3)
            .map((tx) => tx.userId)
        )
      ),
    [transactions]
  );

  const palette = ['#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">User Risk Timeline</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip />
            <Legend />
            {users.map((userId, idx) => (
              <Line
                key={userId}
                dataKey={userId}
                type="monotone"
                stroke={palette[idx % palette.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
};
