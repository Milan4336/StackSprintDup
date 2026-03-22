import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

const Dashboard = lazy(async () => ({ default: (await import('./pages/Dashboard')).Dashboard }));
const Login = lazy(async () => ({ default: (await import('./pages/Login')).Login }));
const Transactions = lazy(async () => ({ default: (await import('./pages/Transactions')).Transactions }));
const Analytics = lazy(async () => ({ default: (await import('./pages/Analytics')).Analytics }));
const Settings = lazy(async () => ({ default: (await import('./pages/Settings')).Settings }));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-slate-300">
    Loading fraud command center...
  </div>
);

export const App = () => (
  <BrowserRouter>
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
