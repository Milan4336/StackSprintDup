import { motion } from 'framer-motion';
import { SmartphoneNfc } from 'lucide-react';
import { UserDevice } from '../../types';

interface DeviceFingerprintPanelProps {
  devices: UserDevice[];
}

export const DeviceFingerprintPanel = ({ devices }: DeviceFingerprintPanelProps) => {
  const suspicious = devices.filter((device) => device.isSuspicious).length;

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.11 }}>
      <h3 className="panel-title">Device Fingerprinting</h3>
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-400">
        {devices.length} devices tracked · {suspicious} suspicious
      </p>

      <div className="space-y-2">
        {devices.slice(0, 10).map((device) => (
          <div key={`${device.userId}-${device.deviceId}`} className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-100"><SmartphoneNfc size={14} />{device.deviceId}</span>
              <span className={device.isSuspicious ? 'text-red-300' : 'text-emerald-300'}>
                {device.isSuspicious ? 'Suspicious' : 'Known'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              User {device.userId} · {device.location} · TX {device.txCount}
            </p>
          </div>
        ))}
        {devices.length === 0 ? (
          <div className="app-empty">
            <p className="text-sm text-slate-500 dark:text-slate-400">No device data yet.</p>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
};
