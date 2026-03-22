import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Wifi, Smartphone, Users, TrendingUp, Activity } from 'lucide-react';
import { EnrichedGraphNode, FraudCluster } from '../../types';

interface GraphRiskPanelProps {
    node: EnrichedGraphNode | null;
    clusters: FraudCluster[];
    onClose: () => void;
}

const RiskRing = ({ score }: { score: number }) => {
    const r = 38;
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - score / 100);
    const color = score >= 70 ? 'var(--status-danger)' : score >= 40 ? 'var(--status-warning)' : 'var(--status-success)';

    return (
        <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
            <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="color-mix(in srgb, var(--surface-border) 80%, transparent)" strokeWidth="10" />
                <circle
                    cx="50" cy="50" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
            <span className="theme-strong-text absolute text-xl font-black">{score}</span>
        </div>
    );
};

const MetricRow = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="theme-divider flex items-center justify-between border-b py-1">
        <span className="theme-muted-text text-xs font-medium">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: highlight ? 'var(--status-danger)' : 'var(--app-text-strong)' }}>{value}</span>
    </div>
);

export const GraphRiskPanel = ({ node, clusters, onClose }: GraphRiskPanelProps) => {
    if (!node) return null;

    const cluster = clusters.find((c) => c.members.includes(node.id));

    const riskLabel =
        node.riskScore >= 70 ? { text: 'HIGH RISK', className: 'theme-status-chip-danger' } :
            node.riskScore >= 40 ? { text: 'ELEVATED', className: 'theme-status-chip-warning' } :
                { text: 'TRUSTED', className: 'theme-status-chip-success' };

    return (
        <AnimatePresence>
            <motion.div
                key="graph-risk-panel"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
                className="theme-surface-card absolute right-4 top-4 z-20 w-72 p-4 backdrop-blur-md shadow-2xl"
                style={{ background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <ShieldAlert size={14} style={{ color: 'var(--accent)' }} />
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Graph Intelligence</span>
                        </div>
                        <p className="theme-mono theme-muted-text max-w-[200px] truncate text-xs" title={node.id}>{node.id}</p>
                    </div>
                    <button onClick={onClose} className="theme-btn-ghost h-7 w-7 p-0" aria-label="Close graph intelligence panel">
                        <X size={16} />
                    </button>
                </div>

                {/* Risk Ring */}
                <RiskRing score={node.riskScore} />
                <div className={`mx-auto mb-4 mt-2 w-fit px-3 py-0.5 ${riskLabel.className}`}>
                    {riskLabel.text} · {node.type}
                </div>

                {/* Node Metrics */}
                <div className="space-y-0.5 mb-4">
                    <MetricRow label="Graph Score" value={node.graphScore.toFixed(3)} highlight={node.graphScore > 0.6} />
                    <MetricRow label="Fraud Neighbor Ratio" value={(node.fraudNeighborRatio * 100).toFixed(1) + '%'} highlight={node.fraudNeighborRatio > 0.5} />
                    <MetricRow label="Shared Devices" value={node.sharedDevices} highlight={node.sharedDevices > 2} />
                    <MetricRow label="Shared IPs" value={node.sharedIPs} highlight={node.sharedIPs > 2} />
                    <MetricRow label="Cluster Density" value={(node.clusterDensity * 100).toFixed(1) + '%'} />
                    <MetricRow label="Fraud Cluster" value={node.isFraudCluster ? 'YES' : 'NO'} highlight={node.isFraudCluster} />
                </div>

                {/* Cluster Info */}
                {cluster && (
                    <div className="theme-divider space-y-2 border-t pt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Activity size={12} style={{ color: 'var(--status-danger)' }} />
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--status-danger)' }}>Fraud Cluster Detected</span>
                        </div>
                        <div
                            className="space-y-1.5 rounded-lg border p-2"
                            style={{
                                background: 'color-mix(in srgb, var(--status-danger) 8%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--status-danger) 28%, transparent)'
                            }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="theme-muted-text text-[10px]">Cluster ID</span>
                                <span className="theme-mono ml-auto text-[10px]" style={{ color: 'var(--status-danger)' }}>{cluster.clusterId}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users size={10} className="theme-muted-text" />
                                <span className="theme-muted-text text-[10px]">Connected Accounts</span>
                                <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--status-danger)' }}>{cluster.size}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Smartphone size={10} className="theme-muted-text" />
                                <span className="theme-muted-text text-[10px]">Shared Devices</span>
                                <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--status-warning)' }}>{cluster.sharedDevices.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Wifi size={10} className="theme-muted-text" />
                                <span className="theme-muted-text text-[10px]">Shared IPs</span>
                                <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--status-warning)' }}>{cluster.sharedIPs.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={10} className="theme-muted-text" />
                                <span className="theme-muted-text text-[10px]">Avg Fraud Score</span>
                                <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--status-danger)' }}>{(cluster.avgFraudScore * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
