import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';

export const Audit = () => {
  const auditQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => monitoringApi.getAudit(300),
    refetchInterval: 8000
  });

  return (
    <section className="panel">
      <h2 className="panel-title">Audit Timeline</h2>
      <div className="space-y-2">
        {auditQuery.data?.map((log) => (
          <article
            key={log._id ?? `${log.createdAt}-${log.eventType}-${log.entityId}`}
            className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {log.eventType} • {log.action}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatSafeDate(log.createdAt)}</p>
            </div>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              Actor: {log.actorEmail ?? 'system'} | Entity: {log.entityType}:{log.entityId ?? 'N/A'}
            </p>
            {log.metadata ? (
              <pre className="mt-2 overflow-auto rounded-lg bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
