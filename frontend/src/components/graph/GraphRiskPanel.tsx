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
    const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';

    return (
        <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
            <svg className="-rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
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
            <span className="absolute text-xl font-black text-white">{score}</span>
        </div>
    );
};

const MetricRow = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${highlight ? 'text-red-400' : 'text-slate-200'}`}>{value}</span>
    </div>
);

export const GraphRiskPanel = ({ node, clusters, onClose }: GraphRiskPanelProps) => {
    if (!node) return null;

    const cluster = clusters.find((c) => c.members.includes(node.id));

    const riskLabel =
        node.riskScore >= 70 ? { text: 'HIGH RISK', css: 'text-red-400 bg-red-500/10 border-red-500/30' } :
            node.riskScore >= 40 ? { text: 'ELEVATED', css: 'text-amber-400 bg-amber-500/10 border-amber-500/30' } :
                { text: 'TRUSTED', css: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };

    return (
        <AnimatePresence>
            <motion.div
                key="graph-risk-panel"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
                className="absolute top-4 right-4 z-20 w-72 rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <ShieldAlert size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Graph Intelligence</span>
                        </div>
                        <p className="text-xs font-mono text-slate-300 truncate max-w-[200px]" title={node.id}>{node.id}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Risk Ring */}
                <RiskRing score={node.riskScore} />
                <div className={`mt-2 mb-4 mx-auto w-fit px-3 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${riskLabel.css}`}>
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
                    <div className="border-t border-slate-700 pt-3 space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Activity size={12} className="text-red-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Fraud Cluster Detected</span>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">Cluster ID</span>
                                <span className="ml-auto font-mono text-[10px] text-red-300">{cluster.clusterId}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-400">Connected Accounts</span>
                                <span className="ml-auto text-[10px] font-bold text-red-300">{cluster.size}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Smartphone size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-400">Shared Devices</span>
                                <span className="ml-auto text-[10px] font-bold text-amber-300">{cluster.sharedDevices.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Wifi size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-400">Shared IPs</span>
                                <span className="ml-auto text-[10px] font-bold text-amber-300">{cluster.sharedIPs.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={10} className="text-slate-400" />
                                <span className="text-[10px] text-slate-400">Avg Fraud Score</span>
                                <span className="ml-auto text-[10px] font-bold text-red-300">{(cluster.avgFraudScore * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
