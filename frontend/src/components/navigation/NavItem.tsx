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
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`group theme-nav-item relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 ${isActive
                ? 'theme-nav-item-active'
                : 'theme-nav-item-idle'
                }`}
        >
            <Icon size={isCollapsed ? 22 : 18} className={`shrink-0 transition-colors ${isActive ? 'theme-nav-icon-active' : 'theme-nav-icon'}`} />

            {!isCollapsed && (
                <span className={`ml-3 text-sm font-semibold tracking-wide transition-colors ${isActive ? 'theme-nav-label-active' : ''}`}>
                    {label}
                </span>
            )}

            {isActive && (
                <div
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-md"
                    style={{ background: 'var(--accent)', boxShadow: '0 0 10px color-mix(in srgb, var(--accent) 75%, transparent)' }}
                />
            )}

            {isCollapsed && (
                <div className="theme-nav-tooltip pointer-events-none absolute left-full ml-4 w-max rounded-lg border px-3 py-1.5 text-xs font-bold opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
                    {label}
                </div>
            )}
        </Link>
    );
};
