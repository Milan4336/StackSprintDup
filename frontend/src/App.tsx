import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CommandCenterLayout } from './layouts/CommandCenterLayout';
import { Login } from './pages/Login';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/auth';

// Legacy pages
import { Settings } from './pages/Settings';
import { Cases } from './pages/Cases';
import { Radar } from './pages/Radar';
import { Audit } from './pages/Audit';
import { ModelHealth } from './pages/ModelHealth';
import { Updates } from './pages/Updates';
import { BehaviorProfiles } from './pages/BehaviorProfiles';
import { Analytics } from './pages/Analytics';

// New Lazy-loaded modular pages
const Overview = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })));
const Transactions = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.Transactions })));
const Intelligence = lazy(() => import('./pages/Intelligence').then(m => ({ default: m.Intelligence })));
const NetworkGraph = lazy(() => import('./pages/NetworkGraph').then(m => ({ default: m.NetworkGraph })));
const GeoAnalytics = lazy(() => import('./pages/GeoAnalytics').then(m => ({ default: m.GeoAnalytics })));
const Devices = lazy(() => import('./pages/Devices').then(m => ({ default: m.Devices })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const AutonomousActions = lazy(() => import('./pages/AutonomousActions').then(m => ({ default: m.AutonomousActions })));
const Simulation = lazy(() => import('./pages/Simulation').then(m => ({ default: m.Simulation })));
const SystemHealth = lazy(() => import('./pages/SystemHealth').then(m => ({ default: m.SystemHealth })));
const UpdatesDashboard = lazy(() => import('./pages/Updates').then(m => ({ default: m.Updates })));
const EntityProfile = lazy(() => import('./pages/entities/EntityProfile').then(m => ({ default: m.EntityProfile })));
const InvestigationWorkspace = lazy(() => import('./pages/investigation/InvestigationWorkspace').then(m => ({ default: m.InvestigationWorkspace })));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard').then(m => ({ default: m.UserDashboard })));

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center bg-[#0b1629]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
  </div>
);

const HomeLoader = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Role-based redirection from root
  if (user?.role === 'user') return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard/overview" replace />;
};

export const App = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* HomeLoader handles intelligent role-based entry point */}
        <Route path="/" element={<HomeLoader />} />

        <Route element={<ProtectedRoute />}>
          {/* Personal Fraud Portal route - Accessible to all roles but user-facing */}
          <Route path="/portal" element={<Suspense fallback={<LoadingFallback />}><UserDashboard /></Suspense>} />

          {/* Command Center Layout - For Admin/Analyst modules */}
          <Route path="/dashboard" element={<CommandCenterLayout />}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<Suspense fallback={<LoadingFallback />}><Overview /></Suspense>} />
            <Route path="transactions" element={<Suspense fallback={<LoadingFallback />}><Transactions /></Suspense>} />
            <Route path="intelligence" element={<Suspense fallback={<LoadingFallback />}><Intelligence /></Suspense>} />
            <Route path="network" element={<Suspense fallback={<LoadingFallback />}><NetworkGraph /></Suspense>} />
            <Route path="geo" element={<Suspense fallback={<LoadingFallback />}><GeoAnalytics /></Suspense>} />
            <Route path="devices" element={<Suspense fallback={<LoadingFallback />}><Devices /></Suspense>} />
            <Route path="alerts" element={<Suspense fallback={<LoadingFallback />}><AlertsPage /></Suspense>} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="actions" element={<Suspense fallback={<LoadingFallback />}><AutonomousActions /></Suspense>} />
            <Route path="simulation" element={<Suspense fallback={<LoadingFallback />}><Simulation /></Suspense>} />
            <Route path="system" element={<Suspense fallback={<LoadingFallback />}><SystemHealth /></Suspense>} />
            <Route path="updates" element={<Suspense fallback={<LoadingFallback />}><UpdatesDashboard /></Suspense>} />
            <Route path="entities/:id" element={<Suspense fallback={<LoadingFallback />}><EntityProfile /></Suspense>} />
            <Route path="investigation" element={<Suspense fallback={<LoadingFallback />}><InvestigationWorkspace /></Suspense>} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/cases" element={<Cases />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/model-health" element={<ModelHealth />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/behavior-profiles" element={<BehaviorProfiles />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
