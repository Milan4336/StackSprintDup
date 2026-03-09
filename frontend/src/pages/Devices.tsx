import { useEffect, useState } from 'react';
import { useDevicesSlice } from '../store/slices/devicesSlice';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { Smartphone, Laptop, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../types';
import { DeviceIntelligencePanel } from '../components/dashboard/DeviceIntelligencePanel';

interface DeviceRank {
    deviceId: string;
    riskScore: number;
    txCount: number;
    fraudCount: number;
    accounts: Set<string>;
    lastSeen: string;
}

const computeDeviceLeaderboard = (transactions: Transaction[]): DeviceRank[] => {
    const map = new Map<string, DeviceRank>();

    for (const tx of transactions) {
        const existing = map.get(tx.deviceId) ?? {
            deviceId: tx.deviceId,
            riskScore: 0,
            txCount: 0,
            fraudCount: 0,
            accounts: new Set<string>(),
            lastSeen: tx.timestamp,
        };
        existing.txCount++;
        if (tx.isFraud) existing.fraudCount++;
        existing.accounts.add(tx.userId);
        existing.riskScore = Math.round(
            (existing.fraudCount / existing.txCount) * 100 * 0.6 +
            (tx.fraudScore ?? 0) * 0.4
        );
        if (!existing.lastSeen || tx.timestamp > existing.lastSeen) {
            existing.lastSeen = tx.timestamp;
        }
        map.set(tx.deviceId, existing);
    }

    return Array.from(map.values())
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);
};

const reputationLabel = (score: number) => {
    if (score >= 75) return { label: 'HIGH RISK', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (score >= 40) return { label: 'MEDIUM RISK', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'TRUSTED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
};

export const Devices = () => {
    const { connectLive, disconnectLive } = useDevicesSlice();
    const [selected, setSelected] = useState<DeviceRank | null>(null);

    const { data: transactions } = useQuery({
        queryKey: ['devices-transactions'],
        queryFn: () => monitoringApi.getTransactions(500),
        refetchInterval: 15000,
    });

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    const { data: deviceIntelligence } = useQuery({
        queryKey: ['devices-intelligence'],
        queryFn: () => monitoringApi.getDeviceIntelligence(100),
        refetchInterval: 15000,
    });

    const leaderboard = transactions ? computeDeviceLeaderboard(transactions) : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Device Fingerprints</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Hardware reputation tracking and shared origin connections.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leaderboard */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-96">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                        Suspicious Device Leaderboard
                    </h3>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1 modern-scrollbar">
                        {leaderboard.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-xs text-slate-500">
                                Loading device data...
                            </div>
                        ) : leaderboard.map((device, i) => {
                            const rep = reputationLabel(device.riskScore);
                            const isPhone = device.deviceId.charCodeAt(0) % 2 === 0;
                            return (
                                <motion.div
                                    key={device.deviceId}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelected(device)}
                                    className="bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-500 w-4">#{i + 1}</span>
                                        {isPhone ? <Smartphone className="text-slate-400" size={14} /> : <Laptop className="text-slate-400" size={14} />}
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">{device.deviceId.substring(0, 18)}...</p>
                                            <p className="text-[10px] text-slate-500">{device.accounts.size} account{device.accounts.size !== 1 ? 's' : ''} · {device.txCount} tx</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 border rounded text-[10px] font-black uppercase ${rep.color}`}>
                                        {rep.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Reputation Engine / Detail Panel */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-96">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Device Reputation Engine</h3>
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div
                                    key={selected.deviceId}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-mono text-slate-300 truncate">{selected.deviceId}</p>
                                        <button onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
                                    </div>

                                    {/* Risk Score Ring */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative flex items-center justify-center w-20 h-20">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                                                <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="8" />
                                                <circle
                                                    cx="40" cy="40" r="34"
                                                    fill="none"
                                                    stroke={selected.riskScore >= 75 ? '#ef4444' : selected.riskScore >= 40 ? '#f59e0b' : '#10b981'}
                                                    strokeWidth="8"
                                                    strokeDasharray={`${2 * Math.PI * 34 * selected.riskScore / 100} ${2 * Math.PI * 34}`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="text-lg font-black text-white">{selected.riskScore}</span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between gap-8">
                                                <span className="text-slate-400 font-bold">Total Transactions</span>
                                                <span className="text-white font-black">{selected.txCount}</span>
                                            </div>
                                            <div className="flex justify-between gap-8">
                                                <span className="text-slate-400 font-bold">Fraud Hits</span>
                                                <span className="text-red-400 font-black">{selected.fraudCount}</span>
                                            </div>
                                            <div className="flex justify-between gap-8">
                                                <span className="text-slate-400 font-bold">Linked Accounts</span>
                                                <span className={`font-black ${selected.accounts.size > 3 ? 'text-red-400' : 'text-slate-200'}`}>
                                                    {selected.accounts.size}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold
                                        ${selected.riskScore >= 75
                                            ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                            : selected.riskScore >= 40
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}`}
                                    >
                                        {selected.riskScore >= 40
                                            ? <AlertTriangle size={14} />
                                            : <CheckCircle size={14} />}
                                        {selected.riskScore >= 75
                                            ? 'High-risk device — linked to multiple fraud events'
                                            : selected.riskScore >= 40
                                                ? 'Suspicious device — elevated fraud association'
                                                : 'Trusted device — low fraud rate'}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-full text-center"
                                >
                                    <ShieldAlert className="text-slate-700 mb-4" size={42} />
                                    <span className="text-sm font-black uppercase tracking-widest text-slate-600">Select a Device</span>
                                    <p className="text-xs text-slate-600 mt-2">Click a row to see its reputation analysis</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Device Intelligence Section */}
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Device Intelligence Profiles</h2>
                <DeviceIntelligencePanel devices={deviceIntelligence || []} />
            </div>
        </div>
    );
};
