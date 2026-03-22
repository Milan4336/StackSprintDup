import { Outlet } from 'react-router-dom';
import { LeftNav } from '../components/navigation/LeftNav';
import { useUiStore } from '../store/ui';
import { Bot, User, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { SystemStatusBar } from '../components/layout/SystemStatusBar';
import { useEffect, useState } from 'react';
import { useThreatStore } from '../store/threatStore';
import { ThreatAudioEngine } from '../components/visual/ThreatAudioEngine';
import { motion, AnimatePresence } from 'framer-motion';

// Visual Intelligence Layer
import { ThreatBorderGlow } from '../components/visual/ThreatBorderGlow';
import { ThreatAtmosphere } from '../components/visual/ThreatAtmosphere';
import { SOCGrid } from '../components/visual/SOCGrid';
import { ThreatShockwave } from '../components/visual/ThreatShockwave';
import { DefenseShield } from '../components/visual/DefenseShield';
import { InteractiveNeuralFlow } from '../components/visual/InteractiveNeuralFlow';
import { ThreatPulseOverlay } from '../components/visual/ThreatPulseOverlay';
import { AlertFlashEffect } from '../components/visual/AlertFlashEffect';
import { ThreatLevelBar } from '../components/visual/ThreatLevelBar';
import { MLActivityIndicator } from '../components/visual/MLActivityIndicator';
import { AttackModeOverlay } from '../components/visual/AttackModeOverlay';
import { FraudCopilot } from '../components/intelligence/FraudCopilot';
import { ThreatLevelIndicator } from '../components/threat/ThreatLevelIndicator';
import { ThreatLockdownModal } from '../components/security/ThreatLockdownModal';
import { ForensicReplay } from '../components/dashboard/ForensicReplay';

export const CommandCenterLayout = () => {
    const { isExecutiveMode, toggleExecutiveMode } = useUiStore();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const isAudioEnabled = useUiStore((state) => state.isAudioEnabled);
    const connectThreatSocket = useThreatStore((state) => state.connectThreatSocket);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Legacy handler activation
    useEffect(() => {
        (window as any).showForensicReplay = (sid: string) => setActiveSessionId(sid);
        return () => { delete (window as any).showForensicReplay; };
    }, []);

    // Connect threat socket on mount
    useEffect(() => {
        connectThreatSocket();
    }, [connectThreatSocket]);

    return (
        <div className="flex h-screen w-full overflow-hidden relative text-[var(--app-text)]">
            {/* ---- Visual Intelligence Layer (z-indexed overlays) ---- */}
            <ThreatAtmosphere />
            <SOCGrid />
            <ThreatShockwave />
            <DefenseShield />
            <InteractiveNeuralFlow />
            <ThreatBorderGlow />
            <ThreatPulseOverlay />
            <AlertFlashEffect />
            <AttackModeOverlay />
            <FraudCopilot />
            <ThreatAudioEngine />

            {/* Sidebar */}
            <LeftNav />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Topbar */}
                <header className="theme-topbar z-10 shrink-0 border-b backdrop-blur-md">
                    {/* Threat Level bar (2px progress) */}
                    <ThreatLevelBar />

                    <div className="h-16 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-black uppercase tracking-widest text-[var(--app-text-strong)]" style={{ fontFamily: 'var(--font-heading)' }}>
                                Fraud Command Center <span className="ml-2" style={{ color: 'var(--accent)' }}>V3</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* ML Activity */}
                            <MLActivityIndicator />

                            {/* Threat Level Indicator */}
                            <ThreatLevelIndicator />

                            {/* Executive Toggle */}
                            <div className="flex items-center gap-3 border-l pl-4 theme-topbar-separator">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--app-text-muted)]">
                                    Exec Mode
                                </span>
                                <button
                                    onClick={toggleExecutiveMode}
                                    className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                    style={{
                                        outlineColor: 'var(--focus-ring)',
                                        background: isExecutiveMode ? 'var(--accent-strong)' : 'color-mix(in srgb, var(--app-text-muted) 45%, transparent)'
                                    }}
                                >
                                    <div
                                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isExecutiveMode ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>

                            {/* Audio Toggle */}
                            <div className="theme-topbar-separator flex items-center gap-2 border-l pl-4">
                                <button
                                    onClick={() => useUiStore.getState().toggleAudio()}
                                    className="theme-btn-ghost rounded-lg p-2"
                                    style={isAudioEnabled
                                        ? { background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }
                                        : undefined}
                                    title="Toggle Threat Audio"
                                >
                                    {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                </button>
                            </div>

                            {/* User Profile */}
                            <div className="theme-topbar-separator flex items-center gap-4 border-l pl-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold leading-none text-[var(--app-text-strong)]">{user?.email}</p>
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                                        {user?.role}
                                    </p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}>
                                    {user?.role === 'admin' ? (
                                        <Bot size={16} style={{ color: 'var(--accent)' }} />
                                    ) : (
                                        <User size={16} style={{ color: 'var(--accent)' }} />
                                    )}
                                </div>
                                <button
                                    onClick={logout}
                                    className="theme-btn-ghost p-1.5"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 modern-scrollbar relative">
                    <div className="max-w-[1600px] mx-auto w-full relative z-10">
                        <Outlet />
                    </div>
                </main>

                {/* Fixed bottom status bar */}
                <SystemStatusBar />
            </div>
            <ThreatLockdownModal />
            <AnimatePresence>
                {activeSessionId && (
                    <ForensicReplay 
                        sessionId={activeSessionId} 
                        onClose={() => setActiveSessionId(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
