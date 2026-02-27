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
    PanelRightClose
} from 'lucide-react';
import { NavItem } from './NavItem';
import { useUiStore } from '../../store/ui';

export const LeftNav = () => {
    const { isSidebarCollapsed, toggleSidebar, isExecutiveMode } = useUiStore();

    const items = [
        { to: '/dashboard/overview', icon: LayoutDashboard, label: 'Overview' },
        { to: '/dashboard/transactions', icon: ListRestart, label: 'Transactions' },
        { to: '/dashboard/intelligence', icon: BrainCircuit, label: 'Intelligence', hideExecutive: true },
        { to: '/dashboard/network', icon: Network, label: 'Network Graph', hideExecutive: true },
        { to: '/dashboard/geo', icon: Map, label: 'Geo Analytics' },
        { to: '/dashboard/devices', icon: MonitorSmartphone, label: 'Devices' },
        { to: '/dashboard/alerts', icon: BellRing, label: 'Alerts' },
        { to: '/dashboard/actions', icon: ShieldAlert, label: 'Autonomous Actions' },
        { to: '/dashboard/simulation', icon: PlayCircle, label: 'Simulation' },
        { to: '/dashboard/system', icon: ActivitySquare, label: 'System Health', hideExecutive: true },
    ];

    const visibleItems = items.filter(item => !(isExecutiveMode && item.hideExecutive));

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarCollapsed ? 80 : 256 }}
            className="flex flex-col h-full bg-slate-900 border-r border-slate-800 shrink-0 relative z-20"
        >
            <div className="flex h-16 items-center px-4 shrink-0 border-b border-slate-800/50 font-black italic tracking-tighter text-white uppercase justify-between">
                {!isSidebarCollapsed && (
                    <span className="truncate bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Intel Console
                    </span>
                )}
                {isSidebarCollapsed && (
                    <span className="mx-auto text-blue-400">IC</span>
                )}
                <button
                    onClick={toggleSidebar}
                    className="text-slate-400 hover:text-white transition-colors"
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

            <div className="p-4 border-t border-slate-800/50">
                <div className={`rounded-xl border border-slate-800 bg-slate-800/30 p-3 
                    ${isSidebarCollapsed ? 'flex justify-center' : ''}`}
                >
                    {isSidebarCollapsed ? (
                        <ShieldAlert className="text-emerald-500" size={20} />
                    ) : (
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="text-emerald-500 shrink-0" size={20} />
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 leading-none">Status</p>
                                <p className="text-xs font-bold text-emerald-500 mt-1">Operational</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};
