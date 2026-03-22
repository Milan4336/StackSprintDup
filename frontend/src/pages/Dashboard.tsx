import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { FraudAlertsPanel } from '../components/alerts/FraudAlertsPanel';
import { AnalyticsCards } from '../components/dashboard/AnalyticsCards';
import { DeviceFingerprintPanel } from '../components/dashboard/DeviceFingerprintPanel';
import { FraudExplanationPanel } from '../components/dashboard/FraudExplanationPanel';
import { FraudRateChart } from '../components/dashboard/FraudRateChart';
import { FraudPieChart } from '../components/dashboard/FraudPieChart';
import { FraudByCountryChart } from '../components/dashboard/FraudByCountryChart';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { FraudTrendChart } from '../components/dashboard/FraudTrendChart';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { ScoringFormulaCard } from '../components/dashboard/ScoringFormulaCard';
import { ForensicDetailModal } from '../components/transactions/ForensicDetailModal';
import { monitoringApi } from '../api/client';
import { SystemBootIntro } from '../components/intro/SystemBootIntro';
import { RiskBadge } from '../components/RiskBadge';
import { FraudRadarMap } from '../components/radar/FraudRadarMap';
import { SimulationControls } from '../components/simulation/SimulationControls';
import { ThreatStatusCard } from '../components/threat/ThreatStatusCard';
import { useTransactions } from '../context/TransactionContext';
import { useDashboardStore } from '../store/dashboard';
import { useIntroStore } from '../store/intro';
import { RiskLevel, Transaction } from '../types';
import { formatSafeDate, safeDate } from '../utils/date';

const riskRank: Record<RiskLevel, number> = { Low: 1, Medium: 2, High: 3 };

type SortKey = 'timestamp' | 'amount' | 'fraudScore' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const Dashboard = () => {
  const { transactions, stats, loading, error, refreshTransactions } = useTransactions();
  const [selectedForensicTx, setSelectedForensicTx] = useState<Transaction | null>(null);
  const hasHydrated = useIntroStore((state) => state.hasHydrated);
  const shouldPlayBootIntro = useIntroStore((state) => state.shouldPlayBootIntro);
  const isBootIntroActive = useIntroStore((state) => state.isBootIntroActive);
  const startBootIntro = useIntroStore((state) => state.startBootIntro);
  const completeBootIntro = useIntroStore((state) => state.completeBootIntro);
  const alerts = useDashboardStore((state) => state.alerts);
  const devices = useDashboardStore((state) => state.devices);
  const explanations = useDashboardStore((state) => state.explanations);
  const simulationMessage = useDashboardStore((state) => state.simulationMessage);
  const connected = useDashboardStore((state) => state.connected);
  const activeAlerts = alerts.filter((alert) => alert.status !== 'resolved').length;
  const fraudPrevented = Math.round(transactions.filter((tx) => tx.action === 'BLOCK').length * 1.25);

  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Play boot animation only when Login.tsx sets pendingIntro = true (fresh login)
  // NOT on page reload — pendingIntro is non-persisted and resets to false on load
  useEffect(() => {
    if (!hasHydrated || isBootIntroActive) return;
    if (shouldPlayBootIntro()) {
      startBootIntro();
    }
  }, [hasHydrated, isBootIntroActive, shouldPlayBootIntro, startBootIntro]);

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
    <>
      <div className="space-y-6" id="analytics">
        <motion.section className="panel relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--accent) 25%, transparent)' }} />
          <div className="absolute -bottom-4 left-0 h-24 w-24 rounded-full blur-2xl" style={{ background: 'color-mix(in srgb, var(--status-success) 22%, transparent)' }} />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="page-kicker">Executive Dashboard</p>
              <h2 className="theme-page-title">Real-Time Fraud Intelligence</h2>
              <p className="theme-page-subtitle">
                Hybrid ML + rules risk orchestration with live geospatial monitoring and autonomous response.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em]">
              <span
                className="chip"
                style={{
                  borderColor: connected
                    ? 'color-mix(in srgb, var(--status-success) 40%, transparent)'
                    : 'color-mix(in srgb, var(--status-warning) 40%, transparent)',
                  background: connected
                    ? 'color-mix(in srgb, var(--status-success) 16%, transparent)'
                    : 'color-mix(in srgb, var(--status-warning) 16%, transparent)',
                  color: connected ? 'var(--status-success)' : 'var(--status-warning)'
                }}
              >
                {connected ? 'Socket Live' : 'Socket Offline'}
              </span>
              <span className="chip">
                {transactions.length} Tracked TX
              </span>
              <button type="button" onClick={() => void refreshTransactions()} className="theme-btn-secondary">
                <RefreshCw size={14} />
                Sync
              </button>
            </div>
          </div>
        </motion.section>

        {loading && transactions.length === 0 ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="skeleton h-36" />
            ))}
          </section>
        ) : null}

        <div className="glass-panel flex items-center justify-between rounded-xl border px-4 py-2 text-xs uppercase tracking-[0.16em] theme-muted-text">
          <span className="flex items-center gap-2.5">
            {connected ? (
              /* ── Connected: animated ECG heartbeat ── */
              <svg width="42" height="18" viewBox="0 0 42 18" aria-hidden="true" style={{ color: 'var(--status-success)' }}>
                <polyline
                  points="0,9 6,9 9,2 12,16 15,4 18,14 21,9 42,9"
                  fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="90" strokeDashoffset="90"
                  style={{ animation: 'live-feed-draw 1.6s ease-in-out infinite' }}
                />
                <circle r="2.5" fill="currentColor" opacity="0.9">
                  <animateMotion dur="1.6s" repeatCount="indefinite"
                    path="M0,9 L6,9 L9,2 L12,16 L15,4 L18,14 L21,9 L42,9" />
                </circle>
              </svg>
            ) : (
              /* ── Disconnected: slow orange flatline pulse ── */
              <svg width="42" height="18" viewBox="0 0 42 18" aria-hidden="true" style={{ color: 'var(--status-warning)' }}>
                <line x1="0" y1="9" x2="42" y2="9"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                  strokeDasharray="4 5"
                  style={{ animation: 'live-feed-flat 2.4s ease-in-out infinite' }}
                />
                <circle cx="21" cy="9" r="2.5" fill="currentColor"
                  style={{ animation: 'live-feed-flat 2.4s ease-in-out infinite' }}
                />
              </svg>
            )}
            <span style={{ color: connected ? 'var(--app-text)' : 'var(--status-warning)' }}>
              Live Feed {connected ? 'Connected' : 'Disconnected'}
            </span>
          </span>
          <span className="flex items-center gap-2">
            {loading ? 'Syncing...' : connected ? 'Operational' : 'Reconnecting...'} <Sparkles size={13} />
          </span>
        </div>
        <style>{`
          @keyframes live-feed-draw {
            0%   { stroke-dashoffset: 90; opacity: 0.3; }
            40%  { stroke-dashoffset: 0;  opacity: 1;   }
            70%  { stroke-dashoffset: 0;  opacity: 1;   }
            100% { stroke-dashoffset: -90; opacity: 0.2; }
          }
          @keyframes live-feed-flat {
            0%, 100% { opacity: 0.35; }
            50%       { opacity: 0.9;  }
          }
        `}</style>

        {simulationMessage ? (
          <div
            className="rounded-xl border px-3 py-2 text-sm"
            style={{
              borderColor: 'color-mix(in srgb, var(--status-success) 36%, transparent)',
              background: 'color-mix(in srgb, var(--status-success) 14%, transparent)',
              color: 'var(--status-success)'
            }}
          >
            {simulationMessage}
          </div>
        ) : null}

        {error ? <div className="app-error text-sm">{error}</div> : null}

        <ThreatStatusCard />
        <ScoringFormulaCard />

        <AnalyticsCards
          transactions={transactions}
          stats={stats}
          activeAlerts={activeAlerts}
          fraudPrevented={fraudPrevented}
        />

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
          <FraudByCountryChart stats={stats} />
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
          <h2 className="mb-3 section-title">Create Transaction</h2>
          <CreateTransactionForm />
        </section>

        <motion.section id="transactions" className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="panel-title mb-0">Realtime Transaction Table</h3>
            <span className="chip">{sortedTransactions.length} rows</span>
          </div>

          <div className="table-shell">
            <table className="min-w-full text-sm">
              <thead className="theme-table-head sticky top-0 z-10 text-left text-xs uppercase tracking-[0.16em] backdrop-blur">
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
                  <th className="px-3 py-3">Action</th>
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
                    <td className="theme-muted-text px-3 py-6 text-sm" colSpan={9}>
                      No transactions yet. Create or simulate transactions.
                    </td>
                  </tr>
                ) : null}
                {sortedTransactions.slice(0, 50).map((tx) => (
                  <tr
                    key={tx.transactionId}
                    onClick={() => setSelectedForensicTx(tx)}
                    className="table-row cursor-pointer transition"
                  >
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--accent)' }}>{tx.transactionId}</td>
                    <td className="px-3 py-3">{tx.userId}</td>
                    <td className="px-3 py-3 font-semibold theme-strong-text">{money.format(tx.amount)}</td>
                    <td className="px-3 py-3">{tx.location}</td>
                    <td className="px-3 py-3">{tx.fraudScore}</td>
                    <td className="px-3 py-3">
                      <RiskBadge value={tx.riskLevel} />
                    </td>
                    <td className="px-3 py-3">{tx.action ?? 'N/A'}</td>
                    <td className="px-3 py-3 text-lg" style={{ color: tx.isFraud ? 'var(--status-danger)' : 'var(--status-success)' }}>●</td>
                    <td className="theme-muted-text px-3 py-3">{formatSafeDate(tx.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <section className="glass-panel theme-muted-text flex items-center gap-2 rounded-xl p-3 text-sm">
          <ShieldAlert size={16} style={{ color: 'var(--status-warning)' }} />
          Live risk analytics and autonomous responses update continuously. Manual refresh is not required.
        </section>
      </div>

      <AnimatePresence>
        {isBootIntroActive ? <SystemBootIntro onComplete={completeBootIntro} /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {selectedForensicTx && (
          <ForensicDetailModal
            transaction={selectedForensicTx}
            onClose={() => setSelectedForensicTx(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
