import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Shield, Zap, Database, Cpu, Layout, Activity, Code, ChevronDown } from 'lucide-react';

interface UpdateItem {
    version: string;
    date: string;
    title: string;
    description: string;
    details?: string;
    type: 'major' | 'feature' | 'fix' | 'performance';
    icon: any;
    color: string;
}

// Re-using the same Globe icon as Sidebar
const Globe = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';

export const Updates = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const query = useQuery({
        queryKey: ['system-updates'],
        queryFn: () => monitoringApi.getSystemUpdates(),
        staleTime: 5 * 60 * 1000
    });

    const updatesResponse = [...(query.data || [])].sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
    );

    return (
        <div className="space-y-8 pb-12">
            {/* ── Header ───────────────────────────────────────────── */}
            <header>
                <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                    Platform Evolution
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Chronological record of system upgrades and forensic capability enhancements.
                </p>
            </header>

            {/* ── Timeline ─────────────────────────────────────────── */}
            <div className="relative space-y-12 before:absolute before:left-[19px] before:top-4 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-blue-500/50 before:to-transparent">
                {query.isLoading ? (
                    <div className="text-sm font-bold text-slate-500 animate-pulse pl-12">Loading system updates via API...</div>
                ) : updatesResponse.map((update, idx) => {
                    // Match string icon name from API to actual Lucide component
                    let Icon: any = Globe;
                    if (update.icon === 'Layout') Icon = Layout;
                    if (update.icon === 'Database') Icon = Database;
                    if (update.icon === 'Cpu') Icon = Cpu;
                    if (update.icon === 'Rocket') Icon = Rocket;
                    if (update.icon === 'Zap') Icon = Zap;

                    return (
                        <motion.div
                            key={update.version}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative pl-12"
                        >
                            {/* Timeline Dot */}
                            <div className={`absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-xl bg-white shadow-xl ring-4 ring-slate-50 dark:bg-slate-950 dark:ring-[#0f172a]`}>
                                <Icon size={18} className={`text-${update.color}-500`} />
                            </div>

                            {/* Content Card */}
                            <div
                                className="panel border-l-2 border-blue-500/30 group hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => setExpandedId(expandedId === update.version ? null : update.version)}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-lg bg-${update.color}-500/10 px-2 py-1 text-[10px] font-bold text-${update.color}-500 uppercase tracking-widest ring-1 ring-${update.color}-500/30`}>
                                            {update.version}
                                        </span>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                            {update.date}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase italic">
                                            <Activity size={12} /> Live in Control Center
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-slate-500 transition-transform ${expandedId === update.version ? 'rotate-180 text-blue-400' : ''}`}
                                        />
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
                                    {update.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    {update.description}
                                </p>

                                <AnimatePresence>
                                    {expandedId === update.version && update.details && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 pb-2 text-sm text-slate-600 dark:text-slate-300">
                                                {update.details.split('\n').map((line: string, i: number) => {
                                                    const trimmed = line.trim();
                                                    if (!trimmed) return null;

                                                    if (trimmed.startsWith('- ')) {
                                                        const text = trimmed.substring(2);
                                                        const boldMatch = text.match(/\*\*(.*?)\*\*\s*(.*)/);
                                                        if (boldMatch) {
                                                            return (
                                                                <div key={i} className="flex gap-2 items-start">
                                                                    <span className="text-blue-500 mt-1">•</span>
                                                                    <p><strong className="text-slate-900 dark:text-white">{boldMatch[1]}</strong> {boldMatch[2]}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div key={i} className="flex gap-2 items-start">
                                                                <span className="text-blue-500 mt-1">•</span>
                                                                <p>{text}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return <p key={i}>{trimmed}</p>;
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Decorative detail */}
                                <div className="mt-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <div className="flex items-center gap-1.5 ring-1 ring-slate-200 dark:ring-slate-800 px-2 py-1 rounded-md">
                                        <Code size={12} /> Production Build
                                    </div>
                                    <div className="flex items-center gap-1.5 ring-1 ring-slate-200 dark:ring-slate-800 px-2 py-1 rounded-md">
                                        <Shield size={12} /> Verified
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* ── Footer Stats ─────────────────────────────────────── */}
            <footer className="panel bg-gradient-to-br from-blue-600/5 to-emerald-600/5 border-dashed border-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Architecture</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 italic">BANK-GRADE</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Protection</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 italic">ENSEMBLE ML</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Deploy State</p>
                        <p className="text-xl font-black text-emerald-500 italic">SYNCED</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Last Sync</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 italic">LIVE</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
