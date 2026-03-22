import { motion } from 'framer-motion';
import {
  Activity,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  LayoutDashboard,
  ListChecks,
  Rocket,
  Settings,
  ShieldAlert,
  Network,
  Users,
  Zap,
  Cpu,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

const menu = [
  { label: 'Dashboard', to: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Transactions', to: '/dashboard/transactions', icon: ListChecks },
  { label: 'Alerts', to: '/dashboard/alerts', icon: ShieldAlert },
  { label: 'Fraud Pulse', to: '/dashboard/geo', icon: Globe },
  { label: 'Intelligence', to: '/dashboard/intelligence', icon: Gauge },
  { label: 'Model Health', to: '/dashboard/model-health', icon: Cpu },
  { label: 'User Behavior', to: '/dashboard/behavior-profiles', icon: Users },
  { label: 'Investigation Workspace', to: '/dashboard/network', icon: Network },
  { label: 'Global Threat Globe', to: '/dashboard/autonomous', icon: Zap },
  { label: 'Simulation', to: '/dashboard/simulation', icon: Rocket },
  { label: 'System Health', to: '/dashboard/system-health', icon: Activity },
  { label: 'System Updates', to: '/dashboard/updates', icon: ListChecks },
  { label: 'Scam Advisor', to: '/dashboard/scam-advisor', icon: MessageSquare },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings }
];

export const Sidebar = ({ onLogout }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 300 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="hidden shrink-0 border-r border-blue-500/10 bg-[#020617]/80 backdrop-blur-3xl lg:flex lg:flex-col relative overflow-hidden"
    >
      {/* Sidebar Atmospheric Power Rail */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="hud-panel p-4 m-4 mb-6">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-3`}>
          {!collapsed && (
            <div className="min-w-0">
              <span className="hud-readout text-blue-400">COMMAND_OS</span>
              <p className="text-lg font-black tracking-tighter text-white italic -mt-1">ULTRA<span className="text-blue-500">HUD</span></p>
            </div>
          )}
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-blue-500/20 bg-blue-500/5 text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/10"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed && (
          <div className="text-[9px] font-mono uppercase tracking-widest text-blue-400/40 border-t border-blue-500/10 pt-2">
            Status: Nominal / v3.7
          </div>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-sm py-2.5 px-3 transition-all duration-300',
                collapsed ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-blue-500/10 text-white ring-l-2 ring-blue-500 shadow-[inset_10px_0_20px_-10px_rgba(59,130,246,0.2)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-blue-100'
              ].join(' ')
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span className={`inline-grid h-8 w-8 shrink-0 place-items-center rounded-sm transition-colors duration-300 ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500 group-hover:text-blue-400'}`}>
                  <item.icon size={16} />
                </span>
                {!collapsed && (
                  <span className={`text-xs font-black uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="active-glow"
                    className="absolute right-2 h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Sign Out ────────────────────────────────────────── */}
      <div className="p-4 pt-4 border-t border-blue-500/10">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full hud-readout flex items-center gap-3 py-3 px-4 rounded-sm border border-red-500/20 bg-red-500/5 text-red-400 transition hover:bg-red-500/10 hover:border-red-500/40 ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="text-sm">⏼</span>
          {!collapsed && <span>System Deauth</span>}
        </button>
      </div>
    </motion.aside>
  );
};
