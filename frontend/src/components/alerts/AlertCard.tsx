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
    LOW: 'var(--accent)',
    MEDIUM: 'var(--status-success)',
    HIGH: 'var(--status-warning)',
    CRITICAL: 'var(--status-danger)'
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
            className={`rounded-xl border p-4 transition-all ${isAcknowledged ? 'opacity-50' : ''}`}
            style={{
                borderColor: `color-mix(in srgb, ${severityColors[alert.severity]} 35%, transparent)`,
                background: `color-mix(in srgb, ${severityColors[alert.severity]} 10%, var(--surface-2) 90%)`,
                color: severityColors[alert.severity],
                boxShadow: alert.severity === 'CRITICAL' ? '0 0 20px color-mix(in srgb, var(--status-danger) 22%, transparent)' : undefined
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg p-1.5" style={{ background: 'color-mix(in srgb, currentColor 18%, transparent)' }}>
                        {severityIcons[alert.severity]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{alert.alertId}</span>
                            {isCritical && (
                                <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter" style={{ background: 'color-mix(in srgb, var(--status-danger) 82%, black 18%)', color: '#fff5f5' }}>Immediate Threat</span>
                            )}
                        </div>
                        <h4 className="theme-strong-text text-sm font-black uppercase tracking-wider">Fraud Threshold Breach</h4>
                    </div>
                </div>
                <div className="text-right">
                    <div className="theme-strong-text text-xl font-black">{(alert.fraudScore * 100).toFixed(1)}%</div>
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Fraud Score</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="theme-muted-text flex items-center gap-2 text-xs">
                    <User size={14} className="opacity-50" />
                    <span className="font-bold truncate">{alert.userId}</span>
                </div>
                <div className="theme-muted-text flex items-center gap-2 text-xs">
                    <MapPin size={14} className="opacity-50" />
                    <span className="font-bold truncate">{alert.payload.location}</span>
                </div>
            </div>

            <div className="space-y-1 mb-4">
                {alert.payload.reasons.map((reason, i) => (
                    <div key={i} className="theme-muted-text flex items-center gap-2 text-[10px] font-bold italic">
                        <ArrowRight size={10} />
                        {reason}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--surface-border)' }}>
                <span className="theme-muted-text text-[10px] font-bold uppercase tracking-widest">
                    {formatDistanceToNow(new Date(alert.createdAt))} ago
                </span>
                {!isAcknowledged && (
                    <button
                        onClick={() => onAcknowledge(alert.alertId)}
                        className="theme-btn-secondary flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                    >
                        Acknowledge
                    </button>
                )}
                {isAcknowledged && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--status-success)' }}>
                        <ShieldCheck size={12} />
                        Acknowledged
                    </div>
                )}
            </div>
        </motion.div>
    );
};
