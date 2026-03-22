import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

const menu = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Settings', to: '/settings' }
];

export const Sidebar = ({ onLogout }: SidebarProps) => {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#0b1220] p-4 lg:block">
      <p className="mb-8 text-sm font-bold uppercase tracking-[0.2em] text-blue-300">Fraud OS</p>

      <nav className="space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              [
                'block rounded-lg px-3 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-blue-600/20 text-blue-200 ring-1 ring-blue-400/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
      >
        Logout
      </button>
    </aside>
  );
};
