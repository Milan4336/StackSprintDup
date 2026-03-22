import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CommandCenterLayout } from './layouts/CommandCenterLayout';
import { Login } from './pages/Login';
import { useAuthStore } from './store/auth';

// Legacy or simple imports
import { ModelHealth } from './pages/ModelHealth';
import { Updates } from './pages/Updates';
import { BehaviorProfiles } from './pages/BehaviorProfiles';
import { Settings } from './pages/Settings';

// New Lazy-loaded modular pages
const Overview = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })));
const Transactions = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.Transactions })));
const Intelligence = lazy(() => import('./pages/Intelligence').then(m => ({ default: m.Intelligence })));
const NetworkGraph = lazy(() => import('./pages/NetworkGraph').then(m => ({ default: m.NetworkGraph })));
const GeoAnalytics = lazy(() => import('./pages/GeoAnalytics').then(m => ({ default: m.GeoAnalytics })));
const Devices = lazy(() => import('./pages/Devices').then(m => ({ default: m.Devices })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const Investigations = lazy(() => import('./pages/Investigations').then(m => ({ default: m.Investigations })));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard').then(m => ({ default: m.UserDashboard })));
const ScamAdvisor = lazy(() => import('./pages/ScamAdvisor').then(m => ({ default: m.ScamAdvisor })));
const AutonomousActions = lazy(() => import('./pages/AutonomousActions').then(m => ({ default: m.AutonomousActions })));
const Simulation = lazy(() => import('./pages/Simulation').then(m => ({ default: m.Simulation })));
const SystemHealth = lazy(() => import('./pages/SystemHealth').then(m => ({ default: m.SystemHealth })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-900">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
  </div>
);

const HomeLoader = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'user') return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard/overview" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeLoader />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/portal" element={<Suspense fallback={<LoadingFallback />}><UserDashboard /></Suspense>} />
        
        <Route path="/dashboard" element={<CommandCenterLayout />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<Suspense fallback={<LoadingFallback />}><Overview /></Suspense>} />
          <Route path="transactions" element={<Suspense fallback={<LoadingFallback />}><Transactions /></Suspense>} />
          <Route path="intelligence" element={<Suspense fallback={<LoadingFallback />}><Intelligence /></Suspense>} />
          <Route path="network" element={<Suspense fallback={<LoadingFallback />}><NetworkGraph /></Suspense>} />
          <Route path="investigations" element={<Suspense fallback={<LoadingFallback />}><Investigations /></Suspense>} />
          <Route path="geo" element={<Suspense fallback={<LoadingFallback />}><GeoAnalytics /></Suspense>} />
          <Route path="devices" element={<Suspense fallback={<LoadingFallback />}><Devices /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<LoadingFallback />}><AlertsPage /></Suspense>} />
          <Route path="scam-advisor" element={<Suspense fallback={<LoadingFallback />}><ScamAdvisor /></Suspense>} />
          <Route path="autonomous" element={<Suspense fallback={<LoadingFallback />}><AutonomousActions /></Suspense>} />
          <Route path="simulation" element={<Suspense fallback={<LoadingFallback />}><Simulation /></Suspense>} />
          <Route path="system-health" element={<Suspense fallback={<LoadingFallback />}><SystemHealth /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<LoadingFallback />}><Analytics /></Suspense>} />
          
          <Route path="model-health" element={<ModelHealth />} />
          <Route path="updates" element={<Updates />} />
          <Route path="behavior-profiles" element={<BehaviorProfiles />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen theme-surface-1 text-white overflow-x-hidden">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
};
