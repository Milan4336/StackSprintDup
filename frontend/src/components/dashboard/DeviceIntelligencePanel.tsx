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
            <p className="theme-muted-text mb-3 text-xs uppercase tracking-[0.15em]">
                {devices.length} Tracked · <span style={{ color: 'var(--status-success)' }}>{trusted} Trusted</span> · <span style={{ color: 'var(--status-warning)' }}>{newDevices} New</span> · <span style={{ color: 'var(--status-danger)' }}>{suspicious} Suspicious</span>
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {devices.map((device) => {
                    let LabelIcon = Shield;
                    let labelColor = 'var(--app-text-muted)';
                    let pillStyle: { background: string; borderColor: string } = {
                        background: 'color-mix(in srgb, var(--surface-1) 80%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--surface-border) 75%, transparent)'
                    };

                    if (device.deviceLabel === 'Trusted Device') {
                        LabelIcon = ShieldCheck;
                        labelColor = 'var(--status-success)';
                        pillStyle = {
                            background: 'color-mix(in srgb, var(--status-success) 12%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--status-success) 30%, transparent)'
                        };
                    } else if (device.deviceLabel === 'Suspicious Device') {
                        LabelIcon = ShieldAlert;
                        labelColor = 'var(--status-danger)';
                        pillStyle = {
                            background: 'color-mix(in srgb, var(--status-danger) 12%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--status-danger) 30%, transparent)'
                        };
                    } else if (device.deviceLabel === 'New Device') {
                        LabelIcon = Shield;
                        labelColor = 'var(--status-warning)';
                        pillStyle = {
                            background: 'color-mix(in srgb, var(--status-warning) 12%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--status-warning) 30%, transparent)'
                        };
                    }

                    return (
                        <div
                            key={`${device.userId}-${device.deviceHash}`}
                            className="theme-surface-subtle rounded-xl p-3 transition"
                            style={{ borderColor: 'var(--surface-border)' }}
                        >
                            <div className="mb-2 flex items-start justify-between">
                                <div>
                                    <div className="theme-strong-text flex items-center gap-1.5 text-sm font-semibold">
                                        <SmartphoneNfc size={14} style={{ color: 'var(--accent)' }} />
                                        <span className="truncate max-w-[120px]" title={device.deviceHash}>{device.deviceHash.substring(0, 12)}...</span>
                                    </div>
                                    <div
                                        className="theme-mono theme-muted-text mt-0.5 w-fit rounded px-1 py-0.5 text-[10px]"
                                        style={{ background: 'color-mix(in srgb, var(--surface-3) 76%, transparent)' }}
                                    >
                                        Score: {device.deviceTrustScore}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium" style={pillStyle}>
                                    <LabelIcon size={12} style={{ color: labelColor }} />
                                    <span style={{ color: labelColor }}>{device.deviceLabel}</span>
                                </div>
                            </div>

                            <div
                                className="theme-muted-text mt-2 grid grid-cols-2 gap-2 rounded-lg p-2 text-xs"
                                style={{ background: 'color-mix(in srgb, var(--surface-2) 72%, transparent)' }}
                            >
                                <div>
                                    <span className="theme-muted-text mb-0.5 block text-[10px] font-semibold uppercase">Device Type</span>
                                    <span className="block truncate" title={device.platform || 'Unknown'}>{device.platform || 'Unknown'} · {device.userAgent || 'Unknown Browser'}</span>
                                </div>
                                <div>
                                    <span className="theme-muted-text mb-0.5 block text-[10px] font-semibold uppercase">Last Location</span>
                                    <span className="truncate block" title={device.lastKnownIp || device.timezone || 'Unknown'}>{device.lastKnownIp || device.timezone || 'Unknown'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="theme-muted-text mb-0.5 block text-[10px] font-semibold uppercase">History</span>
                                    <span className="truncate block">Seen {new Date(device.firstSeen).toLocaleDateString()} — {new Date(device.lastSeen).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {devices.length === 0 ? (
                    <div className="app-empty min-h-[150px]">
                        <p className="theme-muted-text text-sm">No device intelligence data available.</p>
                    </div>
                ) : null}
            </div>
        </motion.article>
    );
};
