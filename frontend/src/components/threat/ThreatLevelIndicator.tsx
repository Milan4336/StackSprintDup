import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';
import { ThreatLevel, useThreatStore } from '../../store/threatStore';

const toneByLevel: Record<ThreatLevel, { border: string; bg: string; text: string; dot: string }> = {
  NORMAL: {
    border: 'color-mix(in srgb, var(--status-success) 36%, transparent)',
    bg: 'color-mix(in srgb, var(--status-success) 12%, transparent)',
    text: 'color-mix(in srgb, var(--status-success) 72%, white 28%)',
    dot: 'var(--status-success)'
  },
  SUSPICIOUS: {
    border: 'color-mix(in srgb, var(--status-warning) 36%, transparent)',
    bg: 'color-mix(in srgb, var(--status-warning) 14%, transparent)',
    text: 'color-mix(in srgb, var(--status-warning) 72%, white 28%)',
    dot: 'var(--status-warning)'
  },
  HIGH: {
    border: 'color-mix(in srgb, var(--status-warning) 44%, transparent)',
    bg: 'color-mix(in srgb, var(--status-warning) 18%, transparent)',
    text: 'color-mix(in srgb, var(--status-warning) 82%, white 18%)',
    dot: 'var(--status-warning)'
  },
  CRITICAL: {
    border: 'color-mix(in srgb, var(--status-danger) 42%, transparent)',
    bg: 'color-mix(in srgb, var(--status-danger) 14%, transparent)',
    text: 'color-mix(in srgb, var(--status-danger) 82%, white 18%)',
    dot: 'var(--status-danger)'
  }
};

export const ThreatLevelIndicator = () => {
  const threatLevel = useThreatStore((state) => state.threatLevel);
  const reason = useThreatStore((state) => state.reason);
  const recentHighRiskCount = useThreatStore((state) => state.recentHighRiskCount);
  const fraudRate = useThreatStore((state) => state.fraudRate);
  const mlStatus = useThreatStore((state) => state.mlStatus);
  const simulationActive = useThreatStore((state) => state.simulationActive);

  const Icon = threatLevel === 'CRITICAL' ? ShieldAlert : AlertTriangle;
  const pulseClass = threatLevel === 'CRITICAL' ? 'threat-critical-pulse' : '';

  const summary = useMemo(
    () =>
      [
        reason,
        `Fraud rate: ${fraudRate.toFixed(1)}%`,
        `High-risk alerts (5m): ${recentHighRiskCount}`,
        `ML status: ${mlStatus}`,
        `Simulation active: ${simulationActive ? 'Yes' : 'No'}`
      ].join('\n'),
    [fraudRate, mlStatus, reason, recentHighRiskCount, simulationActive]
  );

  return (
    <div className="group relative hidden md:block" title={summary}>
      <span
        className={[
          'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold',
          pulseClass
        ].join(' ')}
        style={{
          borderColor: toneByLevel[threatLevel].border,
          background: toneByLevel[threatLevel].bg,
          color: toneByLevel[threatLevel].text
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: toneByLevel[threatLevel].dot }} />
        <Icon size={12} />
        Threat {threatLevel}
      </span>

      <div className="pointer-events-none absolute right-0 top-9 z-50 w-72 rounded-xl border p-3 text-xs opacity-0 shadow-xl transition group-hover:opacity-100"
        style={{
          borderColor: 'color-mix(in srgb, var(--surface-border) 80%, transparent)',
          background: 'color-mix(in srgb, var(--surface-3) 88%, black 12%)',
          color: 'var(--app-text)'
        }}
      >
        <p className="mb-1 font-semibold uppercase tracking-[0.12em] theme-muted-text">Threat Context</p>
        <p className="whitespace-pre-line theme-strong-text">{summary}</p>
      </div>
    </div>
  );
};

