import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { RiskBadge } from '../../components/RiskBadge';
import { StatCard } from '../../components/StatCard';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Transaction, TransactionStats } from '../../types';
import { safeDate } from '../../utils/date';

const COLORS = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444'
};

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [txData, statsData] = await Promise.all([api.getTransactions(300), api.getTransactionStats()]);
      setTransactions(txData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const riskDistribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    for (const tx of transactions) {
      counts[tx.riskLevel] += 1;
    }
    return [
      { name: 'Low', value: counts.Low },
      { name: 'Medium', value: counts.Medium },
      { name: 'High', value: counts.High }
    ];
  }, [transactions]);

  const timeline = useMemo(() => {
    const map = new Map<string, { label: string; avgRisk: number; totalRisk: number; count: number }>();

    for (const tx of transactions) {
      const hour = safeDate(tx.timestamp);
      if (!hour) continue;
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric'
      }).format(hour);

      const bucket = map.get(key) ?? { label, avgRisk: 0, totalRisk: 0, count: 0 };
      bucket.totalRisk += tx.fraudScore;
      bucket.count += 1;
      bucket.avgRisk = bucket.totalRisk / bucket.count;
      map.set(key, bucket);
    }

    return Array.from(map.values())
      .slice(-18)
      .map((item) => ({
        label: item.label,
        avgRisk: Number(item.avgRisk.toFixed(1))
      }));
  }, [transactions]);

  const byLocation = useMemo(() => {
    const map = new Map<string, { location: string; count: number; frauds: number }>();

    for (const tx of transactions) {
      const item = map.get(tx.location) ?? { location: tx.location, count: 0, frauds: 0 };
      item.count += 1;
      if (tx.isFraud) item.frauds += 1;
      map.set(tx.location, item);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [transactions]);

  const latestHighRisk = useMemo(
    () => transactions.filter((tx) => tx.riskLevel === 'High').slice(0, 5),
    [transactions]
  );

  if (loading) return <LoadingState label="Loading fraud analytics..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fraud Rate" value={`${((stats?.fraudRate ?? 0) * 100).toFixed(2)}%`} hint="share of flagged transactions" />
        <StatCard label="Average Risk" value={(stats?.avgRiskScore ?? 0).toFixed(1)} hint="combined rules + ML score" />
        <StatCard label="Transactions" value={`${transactions.length}`} hint="recent transaction records" />
        <StatCard
          label="High-Risk Users"
          value={`${stats?.highRiskUsers.length ?? 0}`}
          hint={(stats?.highRiskUsers ?? []).map((u) => `${u.userId} (${u.count})`).join(', ') || 'none'}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-1">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Risk Distribution</h2>
            <p className="text-xs text-slate-500">Low, Medium, and High classifications</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={56} outerRadius={90}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Risk Trend</h2>
            <p className="text-xs text-slate-500">Average risk score by hour</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f93f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2f93f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="avgRisk" stroke="#1f76d9" fillOpacity={1} fill="url(#riskGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Activity by Location</h2>
            <p className="text-xs text-slate-500">Transaction count and fraud hits</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2f93f6" name="Transactions" radius={[6, 6, 0, 0]} />
                <Bar dataKey="frauds" fill="#ef4444" name="Frauds" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Latest High-Risk Transactions</h2>
            <p className="text-xs text-slate-500">Most recent potentially fraudulent operations</p>
          </div>

          <div className="space-y-3">
            {latestHighRisk.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No high-risk records in current window.</p>
            ) : (
              latestHighRisk.map((tx) => (
                <div key={tx.transactionId} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">{tx.transactionId}</p>
                    <RiskBadge value={tx.riskLevel} />
                  </div>
                  <p className="text-sm text-slate-600">
                    {tx.userId} · {formatCurrency(tx.amount, tx.currency)} · {tx.location}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Score {tx.fraudScore} · {formatDateTime(tx.timestamp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
};
