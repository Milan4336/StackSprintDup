import { useMemo } from 'react';
import { formatSafeDate } from '../../utils/date';

interface NavbarProps {
  onToggleTheme: () => void;
  onLogout: () => void;
  lastUpdated: string | null;
}

const decodeEmail = (): string => {
  const token = localStorage.getItem('token');
  if (!token) return 'Unknown User';

  try {
    const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return 'Unknown User';
    const parsed = JSON.parse(atob(payload)) as { email?: string };
    return parsed.email ?? 'Unknown User';
  } catch {
    return 'Unknown User';
  }
};

export const Navbar = ({ onToggleTheme, onLogout, lastUpdated }: NavbarProps) => {
  const email = useMemo(() => decodeEmail(), []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-100">Fraud Detection Command Center</h1>
          <p className="text-xs text-slate-400">
            {lastUpdated ? `Last sync ${formatSafeDate(lastUpdated)}` : 'Awaiting first sync'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="hidden text-xs font-semibold text-slate-400 md:block">{email}</p>
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Theme
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/35"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
