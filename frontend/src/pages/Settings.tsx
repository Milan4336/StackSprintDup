import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { useDashboardStore } from '../store/dashboard';

export const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { lastUpdated } = useTransactions();
  const connected = useDashboardStore((state) => state.connected);

  return (
    <div className="space-y-6">
      <section className="panel">
        <h3 className="panel-title">Appearance</h3>
        <p className="mb-4 text-sm text-slate-400">Current theme: {theme}</p>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Toggle Theme
        </button>
      </section>

      <section className="panel">
        <h3 className="panel-title">Runtime Status</h3>
        <p className="text-sm text-slate-300">WebSocket: {connected ? 'Connected' : 'Disconnected'}</p>
        <p className="text-sm text-slate-300">Last Updated: {lastUpdated ?? 'N/A'}</p>
      </section>
    </div>
  );
};
