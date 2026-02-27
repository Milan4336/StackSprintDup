import { motion } from 'framer-motion';
import { Rocket, Shield, Zap, Database, Cpu, Layout, Activity, Code } from 'lucide-react';

interface UpdateItem {
    version: string;
    date: string;
    title: string;
    description: string;
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

const updates: UpdateItem[] = [
    {
        version: 'Release v3.0',
        date: 'Today',
        title: 'Modular Intelligence Console',
        description: 'Transformed the legacy dashboard into a 10-module enterprise intelligence console. Rebuilt navigation with a collapsible LeftNav and dynamic routing for optimal workspace utilization.',
        type: 'major',
        icon: Layout,
        color: 'indigo'
    },
    {
        version: 'Patch v3.1',
        date: 'Today',
        title: 'Redis Realtime Event Bus',
        description: 'Re-architected the realtime websocket layer to use a centralized Redis Pub/Sub Event Bus. Subscriptions are now route-dependent, reducing global client payload by 85%.',
        type: 'major',
        icon: Database,
        color: 'red'
    },
    {
        version: 'Patch v3.2',
        date: 'Today',
        title: 'Dashboard Intelligence Worker',
        description: 'Introduced background cron jobs to pre-compute rolling aggregations (Threat Index, Velocity, Risk Pulse) every 10 seconds, drastically lowering API Gateway load.',
        type: 'feature',
        icon: Cpu,
        color: 'emerald'
    },
    {
        version: 'Patch v3.3',
        date: 'Today',
        title: 'Executive Mode Dashboard',
        description: 'Added an Executive Mode toggle that strips away detailed datatables and forensic tools, presenting only top-level KPIs (KL Divergence, System Stress) to c-suite users.',
        type: 'feature',
        icon: Rocket,
        color: 'blue'
    },
    {
        version: 'Patch v2.5',
        date: 'Feb 2026',
        title: 'Multi-Dimensional Intelligence Fusion',
        description: 'Integrated behavioral profiling and fraud graph relationship detection into the core scoring pipeline. Implemented weighted fusion of Rules, ML, Behavior, and Graph scores.',
        type: 'major',
        icon: Database,
        color: 'emerald'
    },
    {
        version: 'Patch v2.1',
        date: 'Feb 2026',
        title: 'Bank-Grade ML Ensemble System',
        description: 'Upgraded to a 3-model weighted ensemble (XGBoost + Autoencoder + iForest) with refined confidence scoring and model fallback logic.',
        type: 'major',
        icon: Cpu,
        color: 'blue'
    },
    {
        version: 'Patch v1.9',
        date: 'Feb 2026',
        title: 'Cinematic Boot & ECG Pulsation',
        description: 'Implemented high-impact SystemBootIntro orbital animations and realtime ECG-pulse connectivity indicators for command center presence.',
        type: 'feature',
        icon: Zap,
        color: 'amber'
    },
    {
        version: 'Patch v1.5',
        date: 'Jan 2026',
        title: 'Enterprise Fraud Radar',
        description: 'Launched geospatial fraud intelligence with heatmaps, clustering, and suspicious geo-jump path detection.',
        type: 'major',
        icon: Globe,
        color: 'indigo'
    }
];

export const Updates = () => {
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
                {updates.map((update, idx) => {
                    const Icon = update.icon;
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
                            <div className="panel border-l-2 border-blue-500/30 group hover:border-blue-500 transition-colors">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-lg bg-${update.color}-500/10 px-2 py-1 text-[10px] font-bold text-${update.color}-500 uppercase tracking-widest ring-1 ring-${update.color}-500/30`}>
                                            {update.version}
                                        </span>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                            {update.date}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase italic">
                                        <Activity size={12} /> Live in Control Center
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
                                    {update.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    {update.description}
                                </p>

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
