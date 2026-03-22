import { motion } from 'framer-motion';
import { Activity, Database, Gauge, Network, RadioTower, Server, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';

const toneStyle = (status: 'UP' | 'DOWN') => {
  const color = status === 'UP' ? 'var(--status-success)' : 'var(--status-danger)';
  return {
    borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    color
  };
};

export const System = () => {
  const healthQuery = useQuery({
    queryKey: ['system-health'],
    queryFn: () => monitoringApi.getSystemHealth(),
    refetchInterval: 7000
  });

  const mlStatusQuery = useQuery({
    queryKey: ['system-ml-status'],
    queryFn: () => monitoringApi.getMlStatus(),
    refetchInterval: 7000
  });

  const health = healthQuery.data;

  return (
    <div className="space-y-6">
      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="page-kicker">Infrastructure Pulse</span>
        <h2 className="theme-page-title">System Health</h2>
        <p className="theme-page-subtitle">Live infrastructure and ML reliability telemetry from API, database, cache, and websocket subsystems.</p>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="theme-muted-text text-xs uppercase tracking-[0.14em]">API Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <Gauge size={18} style={{ color: 'var(--accent)' }} />
            <p className="theme-strong-text text-2xl font-semibold">{health?.apiLatencyMs ?? 0} ms</p>
          </div>
        </article>
        <article className="metric-card">
          <p className="theme-muted-text text-xs uppercase tracking-[0.14em]">ML Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <Activity size={18} style={{ color: 'var(--status-success)' }} />
            <p className="theme-strong-text text-2xl font-semibold">{health?.mlLatencyMs ?? 0} ms</p>
          </div>
        </article>
        <article className="metric-card">
          <p className="theme-muted-text text-xs uppercase tracking-[0.14em]">Redis Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <Network size={18} style={{ color: 'var(--status-info)' }} />
            <p className="theme-strong-text text-2xl font-semibold">{health?.redisLatencyMs ?? 0} ms</p>
          </div>
        </article>
        <article className="metric-card">
          <p className="theme-muted-text text-xs uppercase tracking-[0.14em]">WebSocket Clients</p>
          <div className="mt-2 flex items-center gap-2">
            <RadioTower size={18} style={{ color: 'var(--status-warning)' }} />
            <p className="theme-strong-text text-2xl font-semibold">{health?.websocketClients ?? 0}</p>
          </div>
        </article>
      </section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <h2 className="panel-title">Infrastructure Status</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <p className="rounded-lg border px-3 py-2 text-sm font-semibold" style={toneStyle(health?.mongoStatus ?? 'DOWN')}>
            <Database size={14} className="mr-2 inline" /> Mongo: {health?.mongoStatus ?? 'DOWN'}
          </p>
          <p className="rounded-lg border px-3 py-2 text-sm font-semibold" style={toneStyle(health?.redisStatus ?? 'DOWN')}>
            <Database size={14} className="mr-2 inline" /> Redis: {health?.redisStatus ?? 'DOWN'}
          </p>
          <p className="rounded-lg border px-3 py-2 text-sm font-semibold" style={toneStyle(health?.mlStatus ?? 'DOWN')}>
            <ShieldCheck size={14} className="mr-2 inline" /> ML API: {health?.mlStatus ?? 'DOWN'}
          </p>
          <p className="rounded-lg border px-3 py-2 text-sm font-semibold" style={toneStyle(health?.websocketStatus ?? 'DOWN')}>
            <RadioTower size={14} className="mr-2 inline" /> WebSocket: {health?.websocketStatus ?? 'DOWN'}
          </p>
        </div>
        <p className="theme-muted-text mt-3 text-xs">Snapshot: {formatSafeDate(health?.timestamp)}</p>
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.045 }}>
        <h2 className="panel-title">Container Runtime</h2>
        <p className="theme-muted-text mb-3 text-xs">
          Per-container CPU and memory from Docker stats (live endpoint snapshots).
        </p>
        {!health?.containers?.length ? (
          <p className="theme-empty-state rounded-lg border px-3 py-3 text-sm">
            Container telemetry unavailable. Mount Docker socket and set `DOCKER_CONTAINERS` to enable.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm theme-strong-text">
              <thead>
                <tr className="theme-muted-text text-xs uppercase tracking-[0.12em]">
                  <th className="pb-2 pr-4">Container</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">CPU</th>
                  <th className="pb-2 pr-4">Memory</th>
                </tr>
              </thead>
              <tbody>
                {health.containers.map((container) => (
                  <tr key={container.name} className="theme-table-row">
                    <td className="py-2 pr-4 font-semibold theme-strong-text">
                      <span className="inline-flex items-center gap-2">
                        <Server size={14} style={{ color: 'var(--status-info)' }} />
                        {container.name}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="rounded px-2 py-1 text-xs font-semibold" style={toneStyle(container.status)}>
                        {container.rawStatus}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{container.cpuPercent.toFixed(2)}%</td>
                    <td className="py-2 pr-4">
                      {container.memoryUsageMb.toFixed(1)} / {container.memoryLimitMb.toFixed(1)} MB ({container.memoryPercent.toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <h2 className="panel-title">ML Reliability</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)', color: 'var(--app-text)' }}>
            Status: <span className="font-semibold">{mlStatusQuery.data?.status ?? 'OFFLINE'}</span>
          </p>
          <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)', color: 'var(--app-text)' }}>
            Failure Count: <span className="font-semibold">{mlStatusQuery.data?.failureCount ?? 0}</span>
          </p>
          <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)', color: 'var(--app-text)' }}>
            Circuit Open Until: <span className="font-semibold">{formatSafeDate(mlStatusQuery.data?.circuitOpenUntil ?? null)}</span>
          </p>
          <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-1)', color: 'var(--app-text)' }}>
            Last Error: <span className="font-semibold">{mlStatusQuery.data?.lastError ?? 'N/A'}</span>
          </p>
        </div>
      </motion.section>
    </div>
  );
};
