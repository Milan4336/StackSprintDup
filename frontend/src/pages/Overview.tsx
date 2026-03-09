import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, Zap, ShieldAlert, Cpu, FileText } from 'lucide-react';
import { useDashboardOverviewSlice } from '../store/slices/dashboardOverviewSlice';
import { useUiStore } from '../store/ui';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { TransactionVolumeChart } from '../components/dashboard/TransactionVolumeChart';
import { FraudExplanationPanel } from '../components/dashboard/FraudExplanationPanel';
import { VelocityChart } from '../components/dashboard/VelocityChart';
import { TransactionStream } from '../components/transactions/TransactionStream';
import { useThreatStore } from '../store/threatStore';
import { HUDPanel, HUDDataReadout } from '../components/visual/HUDDecorations';
import { IsolationPanel } from '../components/dashboard/IsolationPanel';
import { FraudResponseLog } from '../components/dashboard/FraudResponseLog';
import { AdminControlPanel } from '../components/dashboard/AdminControlPanel';
import { DeviceIntelligencePanel } from '../components/dashboard/DeviceIntelligencePanel';

const threatLevelColor = (index: number) => {
    if (index >= 86) return { text: 'text-red-400', label: 'Critical', bar: 'from-red-600 to-red-400' };
    if (index >= 66) return { text: 'text-orange-400', label: 'High', bar: 'from-orange-600 to-orange-400' };
    if (index >= 41) return { text: 'text-amber-400', label: 'Elevated', bar: 'from-amber-500 to-yellow-400' };
    return { text: 'text-emerald-400', label: 'Normal', bar: 'from-emerald-600 to-emerald-400' };
};

export const Overview = () => {
    const {
        connected,
        transactionCount: socketTxCount,
        alertCount: socketAlertCount,
        connectLive,
        disconnectLive,
        setOverviewData
    } = useDashboardOverviewSlice();

    const { isExecutiveMode } = useUiStore();
    const liveThreatIndex = useThreatStore((state) => state.threatIndex);
    const [fraudCount, setFraudCount] = useState(0);

    // Part 1 — dashboard overview API with refetchInterval
    const { data: overview } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: () => monitoringApi.getDashboardOverview(),
        refetchInterval: 5000,
        retry: 2,
    });

    const { data: recentTxs } = useQuery({
        queryKey: ['overview-transactions'],
        queryFn: () => monitoringApi.getTransactions(200),
        refetchInterval: 10000
    });

    const { data: explanations } = useQuery({
        queryKey: ['overview-explanations'],
        queryFn: () => monitoringApi.getExplanations(20),
        refetchInterval: 10000
    });

    const { data: deviceIntelligence } = useQuery({
        queryKey: ['overview-device-intelligence'],
        queryFn: () => monitoringApi.getDeviceIntelligence(50),
        refetchInterval: 15000
    });

    useEffect(() => {
        if (overview) {
            setOverviewData(overview);
            setFraudCount(overview.fraudCount ?? 0);

            // Sync API threat index to store so visual enhancers (border glow) fire immediately
            useThreatStore.getState().setThreatIndex(overview.threatIndex);
        }
    }, [overview, setOverviewData]);

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    // Use live socket data when available, fall back to API snapshot
    const threatIndex = liveThreatIndex || overview?.threatIndex || 0;
    const txCount = overview?.transactionCount ?? socketTxCount;
    const alertCount = overview?.alertCount ?? socketAlertCount;
    const tl = threatLevelColor(threatIndex);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
                        Mission <span className="text-blue-500">Control</span>
                    </h1>
                    <div className="flex gap-4 mt-1">
                        <HUDDataReadout label="System Mode" value="Active Intelligence" />
                        <HUDDataReadout label="Security Protocol" value="Elite-v3.7" />
                        <HUDDataReadout label="Telemetry" value="Real-time / Socket-Bound" />
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-blue-500/5 px-6 py-3 rounded-xl border border-blue-500/20 glass-panel">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <div className="relative flex h-3 w-3">
                            {connected ? (
                                <>
                                    <motion.span
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                                    />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                </>
                            ) : (
                                <>
                                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full opacity-40 bg-red-500" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                </>
                            )}
                        </div>
                        <span className={connected ? 'text-emerald-400' : 'text-red-500'}>
                            {connected ? 'Neural Link Established' : 'Attempting Engine Handshake...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI Row — 3 panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI 1: Transaction Volume */}
                <HUDPanel title="Total Transactions">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <Activity size={100} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                            <span className="text-6xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                {txCount.toLocaleString()}
                            </span>
                            <div className="mb-2">
                                <span className="hud-readout border-l border-blue-500/30 pl-2">TX / SESSION</span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
                            <HUDDataReadout label="Status" value="Processing" />
                            <HUDDataReadout label="Peak" value="Live" />
                            <HUDDataReadout label="Unit" value="Global" />
                        </div>
                    </div>
                </HUDPanel>

                {/* KPI 2: Threat Matrix */}
                <HUDPanel title="Neural Threat Matrix">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <Zap size={100} className="text-red-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                            <span className={`text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] ${tl.text}`}>
                                {threatIndex.toFixed(0)}
                            </span>
                            <div className="mb-2">
                                <span className={`hud-readout border-l pl-2 ${tl.text} opacity-100`}>{tl.label}</span>
                            </div>
                        </div>

                        <div className="w-full bg-white/5 h-1.5 rounded-sm mt-4 overflow-hidden relative border border-white/5">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${tl.bar} shadow-[0_0_10px_rgba(239,68,68,0.5)]`}
                                animate={{ width: `${threatIndex}%` }}
                                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                            />
                        </div>

                        <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
                            <HUDDataReadout label="Vector" value="ML-Ensemble" />
                            <HUDDataReadout label="Severity" value={tl.label} />
                            <HUDDataReadout label="Bias" value="Active" />
                        </div>
                    </div>
                </HUDPanel>

                {/* KPI 3: Fraud Intelligence */}
                <HUDPanel title="Actionable Intelligence">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <ShieldAlert size={100} className="text-amber-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                            <span className={`text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] ${fraudCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                                {fraudCount}
                            </span>
                            <div className="mb-2">
                                <span className="hud-readout border-l border-amber-500/30 pl-2">DETECTED EVENTS</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6 border-t border-white/5 pt-4">
                            <HUDDataReadout label="Rate" value={txCount > 0 ? `${((fraudCount / txCount) * 100).toFixed(1)}%` : '0.0%'} />
                            <HUDDataReadout label="Engine" value="Verified" />
                            <HUDDataReadout label="Audit" value="Pending" />
                        </div>
                    </div>
                </HUDPanel>
            </div>



            {
                !isExecutiveMode && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HUDPanel title="Network Throughput">
                                <TransactionVolumeChart transactions={recentTxs || []} />
                            </HUDPanel>
                            <HUDPanel title="Heuristic Explanations">
                                <FraudExplanationPanel transactions={recentTxs || []} explanations={explanations || []} />
                            </HUDPanel>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HUDPanel title="Risk Velocity Vectors">
                                <VelocityChart />
                            </HUDPanel>
                            <HUDPanel title="Live Intelligence Stream">
                                <TransactionStream />
                            </HUDPanel>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <IsolationPanel />
                            <FraudResponseLog />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DeviceIntelligencePanel devices={deviceIntelligence || []} />
                            <AdminControlPanel />
                        </div>
                    </>
                )
            }
        </div >
    );
};
