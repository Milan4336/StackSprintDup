import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ListRestart,
    BrainCircuit,
    Network,
    Map,
    MonitorSmartphone,
    BellRing,
    ShieldAlert,
    PlayCircle,
    ActivitySquare,
    PanelLeftClose,
    PanelRightClose,
    Newspaper,
    BarChart3,
    Settings,
    Zap
} from 'lucide-react';
import { NavItem } from './NavItem';
import { useUiStore } from '../../store/ui';

export const LeftNav = () => {
    const { isSidebarCollapsed, toggleSidebar, isExecutiveMode } = useUiStore();

    const items = [
        { to: '/dashboard/overview', icon: LayoutDashboard, label: 'Overview' },
        { to: '/dashboard/transactions', icon: ListRestart, label: 'Transactions', hideExecutive: true },
        { to: '/dashboard/intelligence', icon: BrainCircuit, label: 'Intelligence', hideExecutive: true },
        { to: '/dashboard/investigations', icon: Network, label: 'Investigation Workspace', hideExecutive: true },
        { to: '/dashboard/geo', icon: Map, label: 'Geo Analytics' },
        { to: '/dashboard/devices', icon: MonitorSmartphone, label: 'Devices' },
        { to: '/dashboard/alerts', icon: ShieldAlert, label: 'Alert Center', hideExecutive: false },
        { to: '/dashboard/autonomous', icon: Zap, label: 'Global Threat Globe' },
        { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/dashboard/simulation', icon: PlayCircle, label: 'Simulation' },
        { to: '/dashboard/system-health', icon: ActivitySquare, label: 'System Health', hideExecutive: true },
        { to: '/dashboard/updates', icon: Newspaper, label: 'Patch Notes' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];

    const visibleItems = items.filter(item => !(isExecutiveMode && item.hideExecutive));

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarCollapsed ? 80 : 256 }}
            className="theme-left-nav flex h-full flex-col shrink-0 relative z-20"
        >
            <div className="theme-left-nav-header flex h-16 shrink-0 items-center justify-between border-b px-4 font-black italic uppercase tracking-tighter" style={{ fontFamily: 'var(--font-heading)' }}>
                {!isSidebarCollapsed && (
                    <span className="truncate bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--accent), var(--accent-strong))' }}>
                        Intel Console
                    </span>
                )}
                {isSidebarCollapsed && (
                    <span className="mx-auto" style={{ color: 'var(--accent)' }}>IC</span>
                )}
                <button
                    onClick={toggleSidebar}
                    className="theme-left-nav-toggle theme-btn-ghost h-8 w-8 p-0"
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isSidebarCollapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 modern-scrollbar">
                {visibleItems.map(item => (
                    <NavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        label={item.label}
                        isCollapsed={isSidebarCollapsed}
                    />
                ))}
            </div>

            <div className="theme-left-nav-footer border-t p-4">
                <div className={`theme-left-nav-status rounded-xl border p-3 
                    ${isSidebarCollapsed ? 'flex justify-center' : ''}`}
                >
                    {isSidebarCollapsed ? (
                        <ShieldAlert size={20} style={{ color: 'var(--status-success)' }} />
                    ) : (
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="shrink-0" size={20} style={{ color: 'var(--status-success)' }} />
                            <div>
                                <p className="theme-left-nav-status-label text-[10px] font-black uppercase leading-none tracking-widest">Status</p>
                                <p className="mt-1 text-xs font-bold" style={{ color: 'var(--status-success)' }}>Operational</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};
