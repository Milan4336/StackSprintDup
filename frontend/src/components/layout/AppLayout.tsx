import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from '../Footer';
import { LiveActivityFeed } from '../activity/LiveActivityFeed';
import { IncidentBanner } from '../threat/IncidentBanner';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';
import { useDashboardStore } from '../../store/dashboard';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useThreatStore } from '../../store/threatStore';
import { HUDCorner } from '../visual/HUDDecorations';
import { ThreatLockdownModal } from '../security/ThreatLockdownModal';

export const AppLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useTheme();
  const { lastUpdated, stats } = useTransactions();
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData);
  const connectLive = useDashboardStore((state) => state.connectLive);
  const disconnectLive = useDashboardStore((state) => state.disconnectLive);
  const alerts = useDashboardStore((state) => state.alerts);
  const setFraudRate = useThreatStore((state) => state.setFraudRate);
  const syncRecentHighRiskFromAlerts = useThreatStore((state) => state.syncRecentHighRiskFromAlerts);
  const threatLevel = useThreatStore((state) => state.threatLevel);
  const location = useLocation();
  useRealtimeSync();

  useEffect(() => {
    void loadDashboardData();
    connectLive();
    return () => {
      disconnectLive();
    };
  }, [connectLive, disconnectLive, loadDashboardData]);

  useEffect(() => {
    setFraudRate((stats?.fraudRate ?? 0) * 100);
  }, [setFraudRate, stats?.fraudRate]);

  useEffect(() => {
    syncRecentHighRiskFromAlerts(alerts);
  }, [alerts, syncRecentHighRiskFromAlerts]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 transition-colors selection:bg-blue-500/30">
      {/* Global HUD Atmosphere Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Technical Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Atmospheric Glows */}
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />

        {/* Global Forensic Scanline */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {threatLevel === 'CRITICAL' && (
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-[20px] border-red-500/5 pointer-events-none"
          />
        )}
      </div>

      <div className="relative z-10 flex min-h-screen">
        <Sidebar onLogout={logout} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onToggleTheme={toggleTheme} onLogout={logout} lastUpdated={lastUpdated} theme={theme} />
          <IncidentBanner />
          <main className="flex-1 p-4 sm:p-6 relative">
            {/* Main Content Area Brackets */}
            <HUDCorner position="top-left" />
            <HUDCorner position="top-right" />
            <HUDCorner position="bottom-left" />
            <HUDCorner position="bottom-right" />

            <div className="mx-auto w-full max-w-[1500px] space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <LiveActivityFeed />
      <ThreatLockdownModal />
    </div>
  );
};
