import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Shield, AlertTriangle, CheckCircle2, MoreHorizontal } from 'lucide-react';

export const Investigations = () => {
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Investigation <span className="text-cyan-500">Workspace</span></h2>
                    <p className="text-xs text-slate-400 font-mono">SEC_OPS // CASE_REVIEWS // DEEP_PACKET_INSPECTION</p>
                </div>
                <div className="flex gap-3">
                    <button className="glass-btn">Export Report</button>
                    <button className="glass-btn ring-1 ring-cyan-500/50">New Case</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <section className="panel">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="panel-title mb-0">Active Case Queue</h3>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input type="text" placeholder="Search cases..." className="input pl-9 text-xs" />
                                </div>
                                <button className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                                    <Filter size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="group p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-200">CASE-#492{i}-ALPHA</h4>
                                                <p className="text-[10px] text-slate-500 font-mono">ASSIGNED: Agent_Zero // STATUS: Investigating</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="chip bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">CRITICAL</span>
                                            <span className="text-[10px] text-slate-600 mt-2">14m ago</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="panel h-full bg-gradient-to-br from-slate-900 to-slate-800/50 border-cyan-500/20">
                        <h3 className="panel-title">Analyst Intelligence</h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                <p className="text-xs text-cyan-200 leading-relaxed italic">
                                    "Pattern detected across 4 active cases in the NA region. Recommend enabling Micro-Isolation for User_ID: suspect-982."
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-black">AI</div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Argus Copilot</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Case Statistics</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <p className="text-xl font-bold text-white">12</p>
                                        <p className="text-[10px] text-slate-500">Open Cases</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <p className="text-xl font-bold text-white">89%</p>
                                        <p className="text-[10px] text-slate-500">SLA Met</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
