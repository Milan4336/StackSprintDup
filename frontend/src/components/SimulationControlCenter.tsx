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
    { id: 'GENERIC', name: 'Random Chaos', icon: Rocket, color: 'text-slate-400', bg: 'bg-slate-400/10', desc: 'Generate 50 random high-velocity patterns' },
    { id: 'CARD_TESTING', name: 'Card Testing', icon: MousePointer2, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Small value rapid merchant jumping' },
    { id: 'ACCOUNT_TAKEOVER', name: 'Account Takeover', icon: Lock, color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Login jump + massive transfer' },
    { id: 'VELOCITY_BURST', name: 'Velocity Burst', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'High frequency single user spike' },
    { id: 'GEO_JUMP', name: 'Geo Location Jump', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Physically impossible travel distance' },
    { id: 'BOT_FLOOD', name: 'Bot Transaction Flood', icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Distributed automated mass volume' },
];

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
        <div className="panel bg-slate-900/40 backdrop-blur-md border border-slate-800/50">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest italic">Simulation Control Center</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Generate Synthetic Fraud Scenarios</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Attack Type Selector */}
                <div className="grid grid-cols-1 gap-2">
                    {ATTACK_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedAttack(type.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group ${selectedAttack === type.id
                                ? 'bg-slate-800 border-slate-700 shadow-lg'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${selectedAttack === type.id ? type.color + ' ' + type.bg : 'text-slate-600 bg-slate-800'}`}>
                                <type.icon size={18} />
                            </div>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-widest ${selectedAttack === type.id ? 'text-slate-100' : 'text-slate-400'}`}>
                                    {type.name}
                                </p>
                                <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">{type.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Configuration Sliders */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 tracking-widest uppercase">
                            <span className="flex items-center gap-1"><Activity size={10} /> Volume</span>
                            <span className="text-slate-300 font-mono">{volume} TX</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="200"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 tracking-widest uppercase">
                            <span className="flex items-center gap-1"><Settings2 size={10} /> Intensity</span>
                            <span className="text-slate-300 font-mono">Lv.{intensity}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    {!activeTask ? (
                        <button
                            onClick={handleStart}
                            disabled={simulateMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95"
                        >
                            <Play size={14} className={simulateMutation.isPending ? 'animate-pulse' : ''} />
                            {simulateMutation.isPending ? 'Deploying Attack...' : 'Start Simulation'}
                        </button>
                    ) : (
                        <button
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest cursor-not-allowed"
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                        className="w-1 bg-red-500 rounded-full"
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
                        className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 italic">
                                <ShieldAlert size={12} /> Live Attack Injected
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-500">#{activeTask}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Check Graph for Pulse Activity</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
