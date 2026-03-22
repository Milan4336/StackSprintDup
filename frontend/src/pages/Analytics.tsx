import { AnalyticsCards } from '../components/dashboard/AnalyticsCards';
import { FraudRateChart } from '../components/dashboard/FraudRateChart';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { FraudTrendChart } from '../components/dashboard/FraudTrendChart';
import { FraudPieChart } from '../components/dashboard/FraudPieChart';
import { useTransactions } from '../context/TransactionContext';

export const Analytics = () => {
  const { transactions, stats, loading } = useTransactions();

  return (
    <div className="space-y-6">
      {loading && transactions.length === 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`analytics-skeleton-${index}`} className="h-28 animate-pulse rounded-2xl bg-slate-800/60" />
          ))}
        </section>
      ) : null}

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
      </section>
    </div>
  );
};
