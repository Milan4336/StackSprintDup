import { FraudRadarMap } from '../components/radar/FraudRadarMap';
import { useTransactions } from '../context/TransactionContext';

export const Radar = () => {
  const { transactions } = useTransactions();

  return (
    <div className="space-y-4">
      <section className="panel">
        <h2 className="panel-title mb-1">Realtime Fraud Radar</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Full-screen geospatial fraud intelligence view with heatmap, clustering, timeline slicing, and geo-jump paths.
        </p>
      </section>
      <FraudRadarMap transactions={transactions} heightClass="h-[calc(100vh-16rem)] min-h-[560px]" />
    </div>
  );
};
