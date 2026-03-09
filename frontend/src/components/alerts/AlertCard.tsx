import React from 'react';
import { motion } from 'framer-motion';
import { AlertRecord, AlertSeverity } from '../../types';
import { AlertCircle, Clock, MapPin, User, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
    alert: AlertRecord;
    onAcknowledge: (id: string) => void;
}

const severityColors: Record<AlertSeverity, string> = {
    LOW: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    MEDIUM: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    HIGH: 'border-orange-500/20 bg-orange-500/5 text-orange-400',
    CRITICAL: 'border-red-500/20 bg-red-500/5 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
};

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
    LOW: <Clock size={16} />,
    MEDIUM: <ShieldCheck size={16} />,
    HIGH: <AlertCircle size={16} />,
    CRITICAL: <Zap size={16} className="animate-pulse" />
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
    const isCritical = alert.severity === 'CRITICAL';
    const isAcknowledged = alert.status === 'ACKNOWLEDGED';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 transition-all ${severityColors[alert.severity]} ${isAcknowledged ? 'opacity-50' : ''}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-current bg-opacity-10`}>
                        {severityIcons[alert.severity]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{alert.alertId}</span>
                            {isCritical && (
                                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Immediate Threat</span>
                            )}
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">Fraud Threshold Breach</h4>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-white">{(alert.fraudScore * 100).toFixed(1)}%</div>
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Fraud Score</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User size={14} className="opacity-50" />
                    <span className="font-bold truncate">{alert.userId}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin size={14} className="opacity-50" />
                    <span className="font-bold truncate">{alert.payload.location}</span>
                </div>
            </div>

            <div className="space-y-1 mb-4">
                {alert.payload.reasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic">
                        <ArrowRight size={10} />
                        {reason}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(alert.createdAt))} ago
                </span>
                {!isAcknowledged && (
                    <button
                        onClick={() => onAcknowledge(alert.alertId)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 border border-white/10"
                    >
                        Acknowledge
                    </button>
                )}
                {isAcknowledged && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <ShieldCheck size={12} />
                        Acknowledged
                    </div>
                )}
            </div>
        </motion.div>
    );
};
