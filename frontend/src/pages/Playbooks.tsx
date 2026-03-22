import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ShieldAlert, Plus, Play, Trash2, Edit3 } from 'lucide-react';
import { useState } from 'react';

interface Playbook {
    id: string;
    name: string;
    description: string;
    trigger: string;
    action: string;
    status: 'ACTIVE' | 'STANDBY';
    conditions: string[];
}

export const Playbooks = () => {
    const [playbooks, setPlaybooks] = useState<Playbook[]>([
        {
            id: 'PB-001',
            name: 'Velocity Surge Defense',
            description: 'Automatically triggers MFA if transaction velocity for a single user exceeds 5/min.',
            trigger: 'VELOCITY_SURGE',
            action: 'TRIGGER_MFA',
            status: 'ACTIVE',
            conditions: ['velocity > 5', 'risk_score > 40']
        },
        {
            id: 'PB-002',
            name: 'Geo-Anomaly Quarantine',
            description: 'Isolates accounts attempting logins from high-risk sanctioned regions.',
            trigger: 'GEO_ANOMALY',
            action: 'ISOLATE_ACCOUNT',
            status: 'STANDBY',
            conditions: ['region_risk == CRITICAL', 'new_device == TRUE']
        },
        {
            id: 'PB-003',
            name: 'Large Transfer Escrow',
            description: 'Routes transactions > $10,000 to manual analyst queue while freezing user balance.',
            trigger: 'HIGH_VALUE_TX',
            action: 'ESCROW_HOLD',
            status: 'ACTIVE',
            conditions: ['amount > 10000']
        }
    ]);

    const toggleStatus = (id: string) => {
        setPlaybooks(prev => prev.map(pb =>
            pb.id === id ? { ...pb, status: pb.status === 'ACTIVE' ? 'STANDBY' : 'ACTIVE' } : pb
        ));
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-[0.4em] bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">
                        AUTONOMOUS.PLAYBOOKS
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60 mt-2">
                        Define & Deploy Automated Defensive Logic Paths
                    </p>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-xs font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/30 transition-all group">
                    <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                    Initialize New Protocol
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                    {playbooks.map((pb, idx) => (
                        <motion.div
                            key={pb.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`cyber-panel p-6 bg-black/40 border-white/5 rounded-2xl relative overflow-hidden group ${pb.status === 'ACTIVE' ? 'border-emerald-500/20' : 'border-slate-800/40'}`}
                        >
                            {pb.status === 'ACTIVE' && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
                            )}

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-xl ${pb.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/60 text-slate-500'} border border-white/5`}>
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider">{pb.name}</h3>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${pb.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                                {pb.status === 'ACTIVE' ? 'SYSTEM_ARMED' : 'STANDBY'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">{pb.description}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <button
                                        onClick={() => toggleStatus(pb.id)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${pb.status === 'ACTIVE' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}
                                    >
                                        {pb.status === 'ACTIVE' ? 'Disarm' : 'Arm Protocol'}
                                    </button>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"><Edit3 size={14} /></button>
                                        <button className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Trigger Event</p>
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={10} className="text-amber-400" />
                                        <span className="text-[10px] font-mono text-slate-200 font-bold">{pb.trigger}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Automated Action</p>
                                    <div className="flex items-center gap-1.5">
                                        <Play size={10} className="text-blue-400" />
                                        <span className="text-[10px] font-mono text-slate-200 font-bold">{pb.action}</span>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Logic Conditions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pb.conditions.map(c => (
                                            <span key={c} className="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-blue-400/80 uppercase">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="cyber-panel p-6 bg-blue-600/5 border-blue-500/20 rounded-2xl">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} /> Fleet Integrity
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Total Active Protocols</span>
                                <span className="text-white font-black">12</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Total Preemptions (24h)</span>
                                <span className="text-emerald-400 font-black">1,432</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">FP Mitigation Rate</span>
                                <span className="text-blue-400 font-black">99.8%</span>
                            </div>
                        </div>
                    </div>

                    <div className="cyber-panel p-6 bg-black/40 border-white/5 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Integrations</p>
                        <div className="space-y-3">
                            {['Slack_Alerts', 'Twilio_MFA', 'SendGrid_Engine', 'Auth0_Bridge'].map(item => (
                                <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 group hover:border-blue-500/20 transition-all cursor-crosshair">
                                    <span className="text-[10px] font-mono text-slate-300">{item}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
