import { motion } from 'framer-motion';
import { Siren, TriangleAlert } from 'lucide-react';
import { FraudAlert } from '../../types';
import { formatSafeDate } from '../../utils/date';

interface FraudAlertsPanelProps {
  alerts: FraudAlert[];
}

export const FraudAlertsPanel = ({ alerts }: FraudAlertsPanelProps) => {
  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h3 className="panel-title">Autonomous Fraud Alerts</h3>

      <div className="space-y-2">
        {alerts.slice(0, 10).map((alert) => (
          <div key={alert.alertId} className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-bold text-red-200">{alert.alertId.slice(0, 8)} · {alert.userId}</p>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-red-300">{alert.status}</span>
            </div>
            <p className="whitespace-pre-line text-xs text-red-100">{alert.reason}</p>
            <p className="mt-1 text-xs text-red-200">Risk {alert.riskLevel} · Score {alert.fraudScore}</p>
            <p className="mt-1 text-[11px] text-red-200/90">Created {formatSafeDate(alert.createdAt)}</p>
          </div>
        ))}

        {alerts.length === 0 ? (
          <div className="app-empty">
            <TriangleAlert className="text-slate-400" size={18} />
            <p className="text-sm text-slate-500 dark:text-slate-400">No alerts yet.</p>
          </div>
        ) : null}
      </div>
      {alerts.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-300">
          <Siren size={14} />
          Alerts stream updates in realtime via websocket.
        </div>
      ) : null}
    </motion.article>
  );
};
