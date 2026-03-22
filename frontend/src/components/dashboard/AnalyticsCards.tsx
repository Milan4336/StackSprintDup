import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ShieldCheck, Siren, WalletCards } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, TransactionStats } from '../../types';
import { safeDate } from '../../utils/date';

interface AnalyticsCardsProps {
  transactions: Transaction[];
  stats: TransactionStats | null;
  activeAlerts?: number;
  fraudPrevented?: number;
}

interface MetricCard {
  label: string;
  value: number;
  decimals: number;
  suffix: string;
  tone: string;
  icon: typeof WalletCards;
  trend: number;
  data: Array<{ value: number }>;
}

const trendDelta = (series: number[]): number => {
  if (series.length < 6) return 0;
  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half);
  const next = series.slice(half);
  const prevAvg = prev.reduce((a, b) => a + b, 0) / Math.max(prev.length, 1);
  const nextAvg = next.reduce((a, b) => a + b, 0) / Math.max(next.length, 1);
  if (prevAvg === 0) return nextAvg > 0 ? 100 : 0;
  return Number((((nextAvg - prevAvg) / prevAvg) * 100).toFixed(1));
};

const AnimatedValue = ({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const initial = display;
    const target = Number.isFinite(value) ? value : 0;

    let raf = 0;
    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = initial + (target - initial) * eased;
      setDisplay(next);
      if (progress < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="metric-value text-3xl font-extrabold tracking-tight">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const AnalyticsCards = memo(({ transactions, stats, activeAlerts = 0, fraudPrevented = 0 }: AnalyticsCardsProps) => {
  const series = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => (safeDate(a.timestamp)?.getTime() ?? 0) - (safeDate(b.timestamp)?.getTime() ?? 0)
    );
    const buckets = new Map<string, { total: number; fraud: number; high: number; score: number }>();
    for (const tx of sorted) {
      const date = safeDate(tx.timestamp);
      if (!date) continue;
      const key = date.toISOString().slice(0, 13);
      const item = buckets.get(key) ?? { total: 0, fraud: 0, high: 0, score: 0 };
      item.total += 1;
      item.score += tx.fraudScore;
      if (tx.isFraud) item.fraud += 1;
      if (tx.riskLevel === 'High') item.high += 1;
      buckets.set(key, item);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-24)
      .map(([time, value]) => ({
        time,
        total: value.total,
        fraudRate: value.total ? (value.fraud / value.total) * 100 : 0,
        highRisk: value.high
      }));
  }, [transactions]);

  const cards = useMemo<MetricCard[]>(() => {
    const totalTransactions = transactions.length;
    const fraudCount = transactions.filter((t) => t.isFraud).length;
    const highRisk = transactions.filter((t) => t.riskLevel === 'High').length;
    const fraudRate = stats?.fraudRate ?? (totalTransactions ? fraudCount / totalTransactions : 0);
    const totalSeries = series.map((item) => item.total);
    const fraudRateSeries = series.map((item) => item.fraudRate);
    const highRiskSeries = series.map((item) => item.highRisk);
    const preventedSeries = series.map((item) => Math.max(0, Math.round(item.fraudRate * 0.8)));

    return [
      {
        label: 'Total Transactions',
        value: totalTransactions,
        decimals: 0,
        suffix: '',
        tone: 'text-blue-300',
        icon: WalletCards,
        trend: trendDelta(totalSeries),
        data: series.map((item) => ({ value: item.total }))
      },
      {
        label: 'Fraud Rate',
        value: fraudRate * 100,
        decimals: 2,
        suffix: '%',
        tone: 'text-amber-300',
        icon: Siren,
        trend: trendDelta(fraudRateSeries),
        data: series.map((item) => ({ value: item.fraudRate }))
      },
      {
        label: 'High Risk Transactions',
        value: highRisk,
        decimals: 0,
        suffix: '',
        tone: 'text-red-300',
        icon: ShieldCheck,
        trend: trendDelta(highRiskSeries),
        data: series.map((item) => ({ value: item.highRisk }))
      },
      {
        label: 'Active Alerts',
        value: activeAlerts,
        decimals: 0,
        suffix: '',
        tone: 'text-rose-300',
        icon: Siren,
        trend: 0,
        data: series.map((item) => ({ value: Math.max(0, Math.round(item.highRisk * 0.7)) }))
      },
      {
        label: 'Fraud Prevented',
        value: fraudPrevented,
        decimals: 0,
        suffix: '',
        tone: 'text-cyan-300',
        icon: ShieldCheck,
        trend: trendDelta(preventedSeries),
        data: series.map((item) => ({ value: Math.max(0, Math.round(item.fraudRate * 0.9)) }))
      }
    ];
  }, [transactions, stats, activeAlerts, fraudPrevented, series]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card, index) => {
        const isPositive = card.trend >= 0;
        const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        return (
          <motion.article
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.28 }}
            className="metric-card group"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{card.label}</p>
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                <card.icon size={15} />
              </span>
            </div>
            <p className={card.tone}>
              <AnimatedValue value={card.value} decimals={card.decimals} suffix={card.suffix} />
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className={[
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  isPositive
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/35 bg-red-500/10 text-red-300'
                ].join(' ')}
              >
                <TrendIcon size={12} />
                {Math.abs(card.trend)}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">vs previous window</span>
            </div>
            <div className="mt-2 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={card.data}>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: 'rgba(15,23,42,0.94)',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: 10,
                      color: '#e2e8f0'
                    }}
                    formatter={(value: number) => Number(value).toFixed(2)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? '#22c55e' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        );
      })}
    </section>
  );
});
