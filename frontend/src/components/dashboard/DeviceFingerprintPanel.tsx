import { UserDevice } from '../../types';

interface DeviceFingerprintPanelProps {
  devices: UserDevice[];
}

export const DeviceFingerprintPanel = ({ devices }: DeviceFingerprintPanelProps) => {
  const suspicious = devices.filter((device) => device.isSuspicious).length;

  return (
    <article className="panel animate-fade-in">
      <h3 className="panel-title">Device Fingerprinting</h3>
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-400">
        {devices.length} devices tracked · {suspicious} suspicious
      </p>

      <div className="space-y-2">
        {devices.slice(0, 10).map((device) => (
          <div key={`${device.userId}-${device.deviceId}`} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-100">{device.deviceId}</span>
              <span className={device.isSuspicious ? 'text-red-300' : 'text-emerald-300'}>
                {device.isSuspicious ? 'Suspicious' : 'Known'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              User {device.userId} · {device.location} · TX {device.txCount}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
};
