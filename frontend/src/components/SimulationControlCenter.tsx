import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Play,
    Square,
    ShieldAlert,
    Settings2,
    Activity,
    Zap,
    MousePointer2,
    Lock,
    Globe,
    Bot,
    Rocket
} from 'lucide-react';
import { monitoringApi } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const ATTACK_TYPES = [
    { id: 'GENERIC', name: 'Random Chaos', tone: 'muted', icon: Rocket, desc: 'Generate 50 random high-velocity patterns' },
    { id: 'CARD_TESTING', name: 'Card Testing', tone: 'accent', icon: MousePointer2, desc: 'Small value rapid merchant jumping' },
    { id: 'ACCOUNT_TAKEOVER', name: 'Account Takeover', tone: 'danger', icon: Lock, desc: 'Login jump + massive transfer' },
    { id: 'VELOCITY_BURST', name: 'Velocity Burst', tone: 'warning', icon: Zap, desc: 'High frequency single user spike' },
    { id: 'GEO_JUMP', name: 'Geo Location Jump', tone: 'info', icon: Globe, desc: 'Physically impossible travel distance' },
    { id: 'BOT_FLOOD', name: 'Bot Transaction Flood', tone: 'success', icon: Bot, desc: 'Distributed automated mass volume' },
];

const toneColor = (tone: string) => {
    if (tone === 'danger') return 'var(--status-danger)';
    if (tone === 'warning') return 'var(--status-warning)';
    if (tone === 'success') return 'var(--status-success)';
    if (tone === 'info') return 'var(--status-info)';
    if (tone === 'accent') return 'var(--accent)';
    return 'var(--app-text-muted)';
};

export const SimulationControlCenter = () => {
    const [selectedAttack, setSelectedAttack] = useState('GENERIC');
    const [volume, setVolume] = useState(50);
    const [intensity, setIntensity] = useState(5);
    const [activeTask, setActiveTask] = useState<string | null>(null);

    const simulateMutation = useMutation({
        mutationFn: (params: { attackType: string; volume: number; intensity: number }) =>
            monitoringApi.simulateFraud(params),
        onSuccess: (data) => {
            setActiveTask(data.taskId);
            setTimeout(() => setActiveTask(null), 10000); // UI feedback duration
        }
    });

    const handleStart = () => {
        simulateMutation.mutate({
            attackType: selectedAttack,
            volume,
            intensity
        });
    };

    return (
        <div className="panel">
            <div className="flex items-center gap-2 mb-6">
                <div
                    className="rounded-lg p-2"
                    style={{ background: 'color-mix(in srgb, var(--status-danger) 12%, transparent)', color: 'var(--status-danger)' }}
                >
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h3 className="theme-strong-text text-sm font-black uppercase tracking-widest italic">Simulation Control Center</h3>
                    <p className="theme-muted-text text-[10px] font-bold uppercase tracking-tight">Generate Synthetic Fraud Scenarios</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Attack Type Selector */}
                <div className="grid grid-cols-1 gap-2">
                    {ATTACK_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedAttack(type.id)}
                            className="theme-surface-subtle flex items-start gap-3 rounded-xl border p-3 text-left transition-all"
                            style={selectedAttack === type.id
                                ? {
                                    borderColor: 'var(--surface-border-strong)',
                                    background: 'color-mix(in srgb, var(--surface-active) 80%, var(--surface-1) 20%)',
                                    boxShadow: `0 10px 20px -16px ${toneColor(type.tone)}`
                                }
                                : undefined}
                        >
                            <div
                                className="rounded-lg p-2"
                                style={selectedAttack === type.id
                                    ? {
                                        color: toneColor(type.tone),
                                        background: `color-mix(in srgb, ${toneColor(type.tone)} 14%, transparent)`
                                    }
                                    : {
                                        color: 'var(--app-text-muted)',
                                        background: 'color-mix(in srgb, var(--surface-3) 75%, transparent)'
                                    }}
                            >
                                <type.icon size={18} />
                            </div>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-widest ${selectedAttack === type.id ? 'theme-strong-text' : 'theme-muted-text'}`}>
                                    {type.name}
                                </p>
                                <p className="theme-muted-text mt-0.5 text-[10px] font-medium leading-tight">{type.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Configuration Sliders */}
                <div className="theme-divider space-y-4 border-t pt-4">
                    <div className="space-y-2">
                        <div className="theme-muted-text flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Activity size={10} /> Volume</span>
                            <span className="theme-mono theme-strong-text">{volume} TX</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="200"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                            style={{ background: 'color-mix(in srgb, var(--surface-3) 90%, transparent)', accentColor: 'var(--status-danger)' }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="theme-muted-text flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Settings2 size={10} /> Intensity</span>
                            <span className="theme-mono theme-strong-text">Lv.{intensity}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                            style={{ background: 'color-mix(in srgb, var(--surface-3) 90%, transparent)', accentColor: 'var(--status-danger)' }}
                        />
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    {!activeTask ? (
                        <button
                            onClick={handleStart}
                            disabled={simulateMutation.isPending}
                            className="theme-btn-danger w-full py-3 text-xs font-black uppercase tracking-widest active:scale-95"
                        >
                            <Play size={14} className={simulateMutation.isPending ? 'animate-pulse' : ''} />
                            {simulateMutation.isPending ? 'Deploying Attack...' : 'Start Simulation'}
                        </button>
                    ) : (
                        <button
                            className="theme-surface-subtle theme-muted-text w-full cursor-not-allowed py-3 text-xs font-black uppercase tracking-widest"
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                        className="w-1 rounded-full"
                                        style={{ background: 'var(--status-danger)' }}
                                    />
                                ))}
                            </div>
                            Simulating: {activeTask}
                        </button>
                    )}
                </div>
            </div>

            {/* HUD Info */}
            <AnimatePresence>
                {activeTask && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="theme-panel-danger mt-4 rounded-xl border p-3"
                        style={{ background: 'color-mix(in srgb, var(--status-danger) 9%, transparent)' }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase italic" style={{ color: 'var(--status-danger)' }}>
                                <ShieldAlert size={12} /> Live Attack Injected
                            </span>
                            <span className="theme-mono theme-muted-text text-[10px] font-bold">#{activeTask}</span>
                        </div>
                        <p className="theme-muted-text mt-1 text-[9px] font-bold uppercase">Check Graph for pulse activity</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
