import { FraudAlert } from '../../types';

interface FraudAlertsPanelProps {
  alerts: FraudAlert[];
}

export const FraudAlertsPanel = ({ alerts }: FraudAlertsPanelProps) => {
  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Autonomous Fraud Alerts</h3>

      <div className="space-y-2">
        {alerts.slice(0, 10).map((alert) => (
          <div key={alert.alertId} className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-bold text-red-200">{alert.alertId.slice(0, 8)} · {alert.userId}</p>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-red-300">{alert.status}</span>
            </div>
            <p className="text-xs text-red-100">{alert.reason}</p>
            <p className="mt-1 text-xs text-red-200">Risk {alert.riskLevel} · Score {alert.fraudScore}</p>
          </div>
        ))}

        {alerts.length === 0 ? (
          <p className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">No alerts yet.</p>
        ) : null}
      </div>
    </article>
  );
};
