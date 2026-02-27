import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CommandCenterLayout } from './layouts/CommandCenterLayout';
import { Login } from './pages/Login';
import { AppLayout } from './components/layout/AppLayout';

// Legacy pages that might not be fully migrated yet
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

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center bg-[#0b1629]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
  </div>
);

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        {/* New Command Center Layout for Dashboard Modules */}
        <Route path="/dashboard" element={<CommandCenterLayout />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<Suspense fallback={<LoadingFallback />}><Overview /></Suspense>} />
          <Route path="transactions" element={<Suspense fallback={<LoadingFallback />}><Transactions /></Suspense>} />
          <Route path="intelligence" element={<Suspense fallback={<LoadingFallback />}><Intelligence /></Suspense>} />
          <Route path="network" element={<Suspense fallback={<LoadingFallback />}><NetworkGraph /></Suspense>} />
          <Route path="geo" element={<Suspense fallback={<LoadingFallback />}><GeoAnalytics /></Suspense>} />
          <Route path="devices" element={<Suspense fallback={<LoadingFallback />}><Devices /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<LoadingFallback />}><AlertsPage /></Suspense>} />
          <Route path="actions" element={<Suspense fallback={<LoadingFallback />}><AutonomousActions /></Suspense>} />
          <Route path="simulation" element={<Suspense fallback={<LoadingFallback />}><Simulation /></Suspense>} />
          <Route path="system" element={<Suspense fallback={<LoadingFallback />}><SystemHealth /></Suspense>} />
        </Route>

        {/* Legacy Layout for unmigrated auxiliary pages */}
        <Route element={<AppLayout />}>
          <Route path="/cases" element={<Cases />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/model-health" element={<ModelHealth />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/behavior-profiles" element={<BehaviorProfiles />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
      <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
    </Routes>
  </BrowserRouter>
);
