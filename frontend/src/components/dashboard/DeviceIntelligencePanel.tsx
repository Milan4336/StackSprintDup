import { motion } from 'framer-motion';
import { SmartphoneNfc, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { DeviceIntelligence } from '../../types';

interface DeviceIntelligencePanelProps {
    devices: DeviceIntelligence[];
}

export const DeviceIntelligencePanel = ({ devices }: DeviceIntelligencePanelProps) => {
    const suspicious = devices.filter((device) => device.deviceLabel === 'Suspicious Device').length;
    const trusted = devices.filter((device) => device.deviceLabel === 'Trusted Device').length;
    const newDevices = devices.filter((device) => device.deviceLabel === 'New Device').length;

    return (
        <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.11 }}>
            <h3 className="panel-title">Device Intelligence</h3>
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-400">
                {devices.length} Tracked · <span className="text-emerald-500">{trusted} Trusted</span> · <span className="text-amber-500">{newDevices} New</span> · <span className="text-red-500">{suspicious} Suspicious</span>
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {devices.map((device) => {
                    let LabelIcon = Shield;
                    let labelColor = 'text-slate-500';

                    if (device.deviceLabel === 'Trusted Device') {
                        LabelIcon = ShieldCheck;
                        labelColor = 'text-emerald-500 dark:text-emerald-400';
                    } else if (device.deviceLabel === 'Suspicious Device') {
                        LabelIcon = ShieldAlert;
                        labelColor = 'text-red-500 dark:text-red-400';
                    } else if (device.deviceLabel === 'New Device') {
                        LabelIcon = Shield;
                        labelColor = 'text-amber-500 dark:text-amber-400';
                    }

                    return (
                        <div key={`${device.userId}-${device.deviceHash}`} className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60 transition-colors hover:border-indigo-500/30">
                            <div className="mb-2 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                        <SmartphoneNfc size={14} className="text-indigo-500" />
                                        <span className="truncate max-w-[120px]" title={device.deviceHash}>{device.deviceHash.substring(0, 12)}...</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded w-fit">
                                        Score: {device.deviceTrustScore}
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${device.deviceLabel === 'Trusted Device' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                                    device.deviceLabel === 'Suspicious Device' ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' :
                                        'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
                                    }`}>
                                    <LabelIcon size={12} className={labelColor} />
                                    <span className={labelColor}>{device.deviceLabel}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div>
                                    <span className="block text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Device Type</span>
                                    <span className="truncate block" title={device.platform || 'Unknown'}>{device.platform || 'Unknown'} • {device.userAgent || 'Unknown Browser'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Last Location</span>
                                    <span className="truncate block" title={device.lastKnownIp || device.timezone || 'Unknown'}>{device.lastKnownIp || device.timezone || 'Unknown'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-[10px] uppercase text-slate-400 font-semibold mb-0.5">History</span>
                                    <span className="truncate block">Seen {new Date(device.firstSeen).toLocaleDateString()} — {new Date(device.lastSeen).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {devices.length === 0 ? (
                    <div className="app-empty min-h-[150px]">
                        <p className="text-sm text-slate-500 dark:text-slate-400">No device intelligence data available.</p>
                    </div>
                ) : null}
            </div>
        </motion.article>
    );
};
