import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnalyticsCards } from '../components/dashboard/AnalyticsCards';
import { DeviceFingerprintPanel } from '../components/dashboard/DeviceFingerprintPanel';
import { FraudByCountryChart } from '../components/dashboard/FraudByCountryChart';
import { FraudPieChart } from '../components/dashboard/FraudPieChart';
import { FraudRateChart } from '../components/dashboard/FraudRateChart';
import { FraudTrendChart } from '../components/dashboard/FraudTrendChart';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { useTransactions } from '../context/TransactionContext';
import { useDashboardStore } from '../store/dashboard';

export const Analytics = () => {
  const { transactions, stats, loading } = useTransactions();
  const alerts = useDashboardStore((state) => state.alerts);
  const devices = useDashboardStore((state) => state.devices);
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData);
  const connectLive = useDashboardStore((state) => state.connectLive);
  const disconnectLive = useDashboardStore((state) => state.disconnectLive);

  useEffect(() => {
    loadDashboardData();
    connectLive();
    return () => disconnectLive();
  }, [loadDashboardData, connectLive, disconnectLive]);

  const activeAlerts = alerts.filter((alert) => alert.status !== 'resolved').length;
  const fraudPrevented = Math.round(transactions.filter((tx) => tx.action === 'BLOCK').length * 1.25);

  return (
    <div className="space-y-6">
      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="section-title">Advanced Analytics</h2>
        <p className="section-subtitle mt-1">Detection performance, fraud distribution, and device intelligence for executive and analyst teams.</p>
      </motion.section>

      {loading && transactions.length === 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`analytics-skeleton-${index}`} className="skeleton h-32" />
          ))}
        </section>
      ) : null}

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
        <FraudByCountryChart stats={stats} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DeviceFingerprintPanel devices={devices} />
      </section>
    </div>
  );
};
