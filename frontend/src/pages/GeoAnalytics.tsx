import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plane, Globe, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { monitoringApi } from '../api/client';
import { FraudRadarMap } from '../components/radar/FraudRadarMap';
import { getSocket } from '../services/socket';
import { Transaction } from '../types';

interface GeoPoint { lat: number; lng: number; risk: number; }

export const GeoAnalytics = () => {
    const [liveCount, setLiveCount] = useState(0);

    // Geo intensity from real API (Part 4)
    const { data: geoPoints = [] } = useQuery<GeoPoint[]>({
        queryKey: ['geo-intensity'],
        queryFn: () => monitoringApi.getGeoIntensity(),
        refetchInterval: 20000,
    });

    // Transactions for FraudRadarMap
    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ['geo-transactions'],
        queryFn: () => monitoringApi.getTransactions(400),
        refetchInterval: 20000,
    });

    // Part 4 — direct geo.live socket listener (does NOT call disconnectSocket)
    useEffect(() => {
        const socket = getSocket();
        const handler = (_pt: GeoPoint) => {
            setLiveCount(c => c + 1);
        };
        socket.on('geo.live', handler);
        return () => {
            // ONLY remove this specific listener — do NOT disconnect the shared socket
            socket.off('geo.live', handler);
        };
    }, []);

    // Computed stats
    const txs = transactions;
    const jumps = txs.filter(t => t.geoVelocityFlag).length;

    const regionMap = new Map<string, { total: number; fraud: number }>();
    txs.forEach(t => {
        const loc = (t.country || t.location || 'Unknown').toUpperCase().trim().slice(0, 12);
        const stat = regionMap.get(loc) || { total: 0, fraud: 0 };
        stat.total++;
        if (t.isFraud) stat.fraud++;
        regionMap.set(loc, stat);
    });
    const topRegions = Array.from(regionMap.entries())
        .filter(([, s]) => s.total >= 3)
        .map(([name, stat]) => ({ name, risk: Math.round((stat.fraud / stat.total) * 100) }))
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="theme-page-title">Geo Analytics</h1>
                <p className="theme-page-subtitle">Global origin heatmaps, impossible travel detection, and regional risk.</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="theme-surface-card theme-panel-danger p-6 flex items-center justify-between">
                    <div>
                        <h3 className="theme-stat-label mb-2">Impossible Travel</h3>
                        <div className="flex items-end gap-3">
                            <span className="theme-strong-text text-4xl font-black">{jumps}</span>
                            <span className="mb-1 text-sm font-bold" style={{ color: 'var(--status-danger)' }}>Detected</span>
                        </div>
                        <p className="theme-muted-text mt-2 text-[10px] font-bold uppercase">Based on {txs.length} transactions</p>
                    </div>
                    <div
                        className="rounded-full p-4"
                        style={{ background: 'color-mix(in srgb, var(--status-danger) 12%, transparent)' }}
                    >
                        <Plane size={28} style={{ color: 'var(--status-danger)' }} />
                    </div>
                </div>

                <div className="theme-surface-card theme-panel-accent p-6">
                    <h3 className="theme-stat-label mb-2 flex items-center gap-2">
                        <Globe size={14} style={{ color: 'var(--accent)' }} /> Mapped Points
                    </h3>
                    <div className="flex items-end gap-3">
                        <span className="theme-strong-text text-4xl font-black">{geoPoints.length}</span>
                        <span className="mb-1 text-sm font-bold" style={{ color: 'var(--accent)' }}>Clusters</span>
                    </div>
                    <p className="theme-muted-text mt-2 text-[10px] font-bold uppercase tracking-wider">
                        +{liveCount} live stream events
                    </p>
                </div>

                <div className="theme-surface-card theme-panel-warning p-6">
                    <h3 className="theme-stat-label mb-3">Top Risk Regions</h3>
                    <div className="space-y-3 mt-2">
                        {topRegions.map((region, i) => (
                            <div key={region.name}>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="theme-strong-text">{region.name}</span>
                                    <span className="theme-muted-text">{region.risk}%</span>
                                </div>
                                <div
                                    className="h-1.5 w-full overflow-hidden rounded-full"
                                    style={{ background: 'color-mix(in srgb, var(--surface-3) 92%, transparent)' }}
                                >
                                    <motion.div
                                        className="h-full"
                                        style={{ background: 'var(--status-danger)' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${region.risk}%` }}
                                        transition={{ delay: i * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                        {topRegions.length === 0 && (
                            <p className="theme-muted-text text-xs">Awaiting transaction data...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Full-width map — Leaflet renders into a fixed container */}
            <div className="theme-surface-card overflow-hidden" style={{ height: 520 }}>
                {txs.length > 0 ? (
                    <FraudRadarMap transactions={txs} />
                ) : (
                    <div className="theme-muted-text flex h-full flex-col items-center justify-center">
                        <Globe size={48} className="mb-4 opacity-30" />
                        <p className="text-sm font-black uppercase tracking-widest">Loading map data...</p>
                    </div>
                )}
            </div>

            {/* High-risk geo clusters */}
            {geoPoints.length > 0 && (
                <div className="theme-surface-card p-6">
                    <h3 className="theme-stat-label mb-4">
                        <AlertTriangle size={14} className="mr-2 inline" style={{ color: 'var(--status-warning)' }} />
                        Top Risk Clusters (24h)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[...geoPoints]
                            .sort((a, b) => b.risk - a.risk)
                            .slice(0, 10)
                            .map((pt, i) => (
                                <div key={i} className="theme-surface-subtle rounded-xl p-3 text-center">
                                    <div
                                        className="text-lg font-black"
                                        style={{ color: pt.risk >= 0.7 ? 'var(--status-danger)' : pt.risk >= 0.4 ? 'var(--status-warning)' : 'var(--status-success)' }}
                                    >
                                        {Math.round(pt.risk * 100)}%
                                    </div>
                                    <div className="theme-muted-text mt-1 text-[10px] font-bold">
                                        {pt.lat.toFixed(1)}, {pt.lng.toFixed(1)}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};
