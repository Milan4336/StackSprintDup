import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { HUDPanel } from '../visual/HUDDecorations';
import { monitoringApi } from '../../api/client';
import { formatDistanceToNow, isValid } from 'date-fns';

export const FraudResponseLog = () => {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        monitoringApi.getAudit(50).then(data => {
            // Filter audit logs for actions related to fraud response (user status, device unfreeze, etc.)
            const responseLogs = data.filter(log =>
                log.eventType.startsWith('user.account.') ||
                log.eventType.startsWith('admin.') ||
                log.eventType.startsWith('system.safemode')
            ).slice(0, 10);
            setLogs(responseLogs);
        }).catch(() => { });
    }, []);

    const getLogStyle = (eventType: string) => {
        if (eventType.includes('safemode')) return 'border-blue-500 text-blue-400';
        if (eventType.includes('admin')) return 'border-emerald-500 text-emerald-400';
        return 'border-orange-500 text-orange-400';
    };

    return (
        <HUDPanel title="Fraud Response Action Log">
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto modern-scrollbar pr-2">
                {logs.length === 0 ? (
                    <div className="flex items-center justify-center p-6 bg-slate-900/50 rounded border border-white/5 border-dashed">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">No recent response actions.</p>
                    </div>
                ) : (
                    <div className="relative border-l border-slate-700 ml-3 space-y-6">
                        {logs.map((log, i) => (
                            <div key={i} className="relative pl-6">
                                <span className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-950 border-2 ${getLogStyle(log.eventType)}`} />
                                <div className="flex justify-between items-start mb-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${getLogStyle(log.eventType).split(' ')[1]}`}>
                                        {log.eventType}
                                    </p>
                                    <span className="text-[10px] font-mono text-slate-500">
                                        {log.createdAt && isValid(new Date(log.createdAt))
                                            ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                                            : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 font-mono">
                                    {log.metadata?.reason || `Action performed on ${log.entityType} ${log.entityId}`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </HUDPanel>
    );
};
