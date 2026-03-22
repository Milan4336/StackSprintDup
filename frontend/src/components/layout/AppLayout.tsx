import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from '../Footer';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';
import { useDashboardStore } from '../../store/dashboard';

export const AppLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const { toggleTheme } = useTheme();
  const { lastUpdated } = useTransactions();
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData);
  const connectLive = useDashboardStore((state) => state.connectLive);
  const disconnectLive = useDashboardStore((state) => state.disconnectLive);

  useEffect(() => {
    void loadDashboardData();
    connectLive();
    return () => {
      disconnectLive();
    };
  }, [connectLive, disconnectLive, loadDashboardData]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar onLogout={logout} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onToggleTheme={toggleTheme} onLogout={logout} lastUpdated={lastUpdated} />
          <main className="flex-1 space-y-6 p-4 sm:p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
