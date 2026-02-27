import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { LeftNav } from '../components/navigation/LeftNav';
import { useUiStore } from '../store/ui';
import { Bot, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export const CommandCenterLayout = () => {
    const { isExecutiveMode, toggleExecutiveMode } = useUiStore();
    const logout = useAuthStore((state) => state.logout);

    // Mock user for the dashboard UI since auth store only manages the JWT token
    const user = { email: 'admin@fraud.cmd', role: 'admin' };

    return (
        <div className="flex h-screen w-full bg-[#0b1629] overflow-hidden text-slate-200">
            {/* Sidebar */}
            <LeftNav />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 shrink-0 bg-[#0b1629]/80 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-black uppercase tracking-widest text-slate-100">
                            Fraud Command Center <span className="text-blue-500 ml-2">V3</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Executive Toggle */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Exec Mode
                            </span>
                            <button
                                onClick={toggleExecutiveMode}
                                className={`relative h-6 w-11 rounded-full transition-colors ${isExecutiveMode ? 'bg-indigo-500' : 'bg-slate-700'
                                    }`}
                            >
                                <div
                                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isExecutiveMode ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-4 pl-6 border-l border-slate-800/50">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-white leading-none">{user?.email}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-1">
                                    {user?.role}
                                </p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                                {user?.role === 'admin' ? (
                                    <Bot size={16} className="text-blue-400" />
                                ) : (
                                    <User size={16} className="text-blue-400" />
                                )}
                            </div>
                            <button
                                onClick={logout}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 modern-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto w-full relative z-10">
                        <Outlet />
                    </div>
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
                </main>
            </div>
        </div>
    );
};
