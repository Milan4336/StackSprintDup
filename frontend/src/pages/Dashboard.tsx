import { useMemo, useState } from 'react';
import { FraudAlertsPanel } from '../components/alerts/FraudAlertsPanel';
import { AnalyticsCards } from '../components/dashboard/AnalyticsCards';
import { DeviceFingerprintPanel } from '../components/dashboard/DeviceFingerprintPanel';
import { FraudExplanationPanel } from '../components/dashboard/FraudExplanationPanel';
import { FraudRateChart } from '../components/dashboard/FraudRateChart';
import { FraudPieChart } from '../components/dashboard/FraudPieChart';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { FraudTrendChart } from '../components/dashboard/FraudTrendChart';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { RiskBadge } from '../components/RiskBadge';
import { FraudRadarMap } from '../components/radar/FraudRadarMap';
import { SimulationControls } from '../components/simulation/SimulationControls';
import { useTransactions } from '../context/TransactionContext';
import { useDashboardStore } from '../store/dashboard';
import { RiskLevel, Transaction } from '../types';
import { formatSafeDate, safeDate } from '../utils/date';

const riskRank: Record<RiskLevel, number> = { Low: 1, Medium: 2, High: 3 };

type SortKey = 'timestamp' | 'amount' | 'fraudScore' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const Dashboard = () => {
  const { transactions, stats, loading, error, refreshTransactions } = useTransactions();
  const alerts = useDashboardStore((state) => state.alerts);
  const devices = useDashboardStore((state) => state.devices);
  const explanations = useDashboardStore((state) => state.explanations);
  const simulationMessage = useDashboardStore((state) => state.simulationMessage);
  const connected = useDashboardStore((state) => state.connected);

  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];

    sorted.sort((a: Transaction, b: Transaction) => {
      let value = 0;
      switch (sortKey) {
        case 'amount':
          value = a.amount - b.amount;
          break;
        case 'fraudScore':
          value = a.fraudScore - b.fraudScore;
          break;
        case 'riskLevel':
          value = riskRank[a.riskLevel] - riskRank[b.riskLevel];
          break;
        case 'timestamp':
        default:
          value = (safeDate(a.timestamp)?.getTime() ?? 0) - (safeDate(b.timestamp)?.getTime() ?? 0);
          break;
      }

      return sortDirection === 'asc' ? value : -value;
    });

    return sorted;
  }, [transactions, sortDirection, sortKey]);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  return (
    <div className="space-y-6" id="analytics">
      {loading && transactions.length === 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="h-28 animate-pulse rounded-2xl bg-slate-800/60" />
          ))}
        </section>
      ) : null}

      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-300">
        <span>Live Feed {connected ? 'Connected' : 'Disconnected'}</span>
        <span>{loading ? 'Syncing...' : 'Operational'}</span>
      </div>

      {simulationMessage ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {simulationMessage}
        </div>
      ) : null}

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div> : null}

      <AnalyticsCards transactions={transactions} stats={stats} />

      <section className="grid gap-4 xl:grid-cols-2">
        <FraudRateChart transactions={transactions} />
        <RiskDistributionChart transactions={transactions} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TransactionVolumeChart transactions={transactions} />
        <FraudTrendChart transactions={transactions} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <FraudPieChart transactions={transactions} />
        <FraudExplanationPanel transactions={transactions} explanations={explanations} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SimulationControls />
        <DeviceFingerprintPanel devices={devices} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <FraudAlertsPanel alerts={alerts} />
        <FraudRadarMap transactions={transactions} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">Create Transaction</h2>
        <CreateTransactionForm />
      </section>

      <section id="transactions" className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="panel-title">Real-Time Transaction Table</h3>
          <button
            type="button"
            onClick={() => void refreshTransactions()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-3 py-3">Transaction</th>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => setSort('amount')} className="table-sort-btn">
                    Amount {sortKey === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => setSort('fraudScore')} className="table-sort-btn">
                    Risk Score {sortKey === 'fraudScore' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => setSort('riskLevel')} className="table-sort-btn">
                    Risk {sortKey === 'riskLevel' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="px-3 py-3">Fraud</th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => setSort('timestamp')} className="table-sort-btn">
                    Time {sortKey === 'timestamp' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-sm text-slate-400" colSpan={8}>
                    No transactions yet. Create or simulate transactions.
                  </td>
                </tr>
              ) : null}
              {sortedTransactions.map((tx) => (
                <tr key={tx.transactionId} className="border-t border-slate-800/80 bg-slate-900/40 transition hover:bg-slate-800/70">
                  <td className="px-3 py-3 font-semibold text-slate-100">{tx.transactionId}</td>
                  <td className="px-3 py-3 text-slate-300">{tx.userId}</td>
                  <td className="px-3 py-3 text-slate-200">{money.format(tx.amount)}</td>
                  <td className="px-3 py-3 text-slate-300">{tx.location}</td>
                  <td className="px-3 py-3 text-slate-200">{tx.fraudScore}</td>
                  <td className="px-3 py-3">
                    <RiskBadge value={tx.riskLevel} />
                  </td>
                  <td className="px-3 py-3 text-lg">{tx.isFraud ? '🛑' : '✅'}</td>
                  <td className="px-3 py-3 text-slate-400">{formatSafeDate(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
