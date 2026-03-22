import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../api/client';
import { AlertRecord } from '../types';
import { AlertCard } from '../components/alerts/AlertCard';
import { Bell, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Alerts = () => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CRITICAL'>('ALL');

  const fetchAlerts = async () => {
    try {
      const data = await monitoringApi.getLiveAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const handleNewAlert = (e: any) => {
      setAlerts(prev => [e.detail, ...prev].slice(0, 50));
    };

    window.addEventListener('fraud.alerts', handleNewAlert);
    return () => window.removeEventListener('fraud.alerts', handleNewAlert);
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      const updated = await monitoringApi.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.alertId === id ? updated : a));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'OPEN') return a.status === 'OPEN';
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="page-kicker">Threat Operations</span>
            <h1 className="theme-page-title flex items-center gap-3">
              Alert Center
              {' '}
            {criticalCount > 0 && (
              <span
                className="rounded-lg px-2 py-0.5 text-xs font-black uppercase tracking-wide animate-pulse"
                style={{ background: 'color-mix(in srgb, var(--status-danger) 85%, black 15%)', color: '#fff5f5' }}
              >
                {criticalCount} Critical
              </span>
            )}
            </h1>
            <p className="theme-page-subtitle">Real-time fraud alert orchestration and threat acknowledgement.</p>
          </div>

          <div className="theme-segmented-control">
            {(['ALL', 'OPEN', 'CRITICAL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`theme-segmented-button ${filter === f ? 'theme-segmented-button-active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="theme-stat-card theme-stat-card-success">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--status-success) 14%, transparent)' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--status-success)' }} />
              </div>
              <h3 className="theme-stat-label">Resolution Rate</h3>
            </div>
            <div className="theme-stat-value">
              {alerts.length > 0
                ? Math.round((alerts.filter(a => a.status === 'ACKNOWLEDGED').length / alerts.length) * 100)
                : 0}%
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide theme-muted-text">of last 50 threats cleared</p>
          </div>

          <div className="theme-stat-card theme-stat-card-danger">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--status-danger) 14%, transparent)' }}>
                <ShieldAlert size={20} style={{ color: 'var(--status-danger)' }} />
              </div>
              <h3 className="theme-stat-label">High Risk Pool</h3>
            </div>
            <div className="theme-stat-value">
              {alerts.filter(a => a.fraudScore > 0.85).length}
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide theme-muted-text">Pending investigation</p>
          </div>
        </div>

        {/* Alerts Stream */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="theme-empty-state h-64">
              <RefreshCw className="mb-4 animate-spin" size={32} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-bold uppercase tracking-widest">Syncing with threat engine...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="theme-empty-state h-64">
              <Bell className="mb-4" size={48} style={{ color: 'var(--app-text-muted)' }} />
              <span className="theme-muted-text text-center text-xs font-bold uppercase tracking-widest">
                All clear. No {filter.toLowerCase()} alerts active.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAlerts.map(alert => (
                  <AlertCard
                    key={alert.alertId}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
