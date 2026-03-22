import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItemClass = ({ isActive }: { isActive: boolean }): string =>
  [
    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  ].join(' ');

export const AppShell = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout
  }));

  const onLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 text-ink">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <p className="text-lg font-extrabold tracking-tight text-slate-900">Fraud Command Center</p>
            <nav className="flex items-center gap-2">
              <NavLink to="/dashboard" className={navItemClass}>
                Dashboard
              </NavLink>
              <NavLink to="/transactions" className={navItemClass}>
                Transactions
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.email ?? 'Unknown user'}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role ?? 'n/a'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
