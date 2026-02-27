import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    isCollapsed?: boolean;
}

export const NavItem = ({ to, icon: Icon, label, isCollapsed }: NavItemProps) => {
    const location = useLocation();
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
        <Link
            to={to}
            className={`group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 ${isActive
                ? 'bg-blue-500/10 text-blue-500'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
        >
            <Icon size={isCollapsed ? 22 : 18} className={`shrink-0 transition-colors ${isActive ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-slate-200'}`} />

            {!isCollapsed && (
                <span className={`ml-3 text-sm font-semibold tracking-wide transition-colors ${isActive ? 'text-blue-500' : ''}`}>
                    {label}
                </span>
            )}

            {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-md bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}

            {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-4 w-max rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
                    {label}
                </div>
            )}
        </Link>
    );
};
