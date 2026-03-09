import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../api/client';
import { AlertRecord } from '../types';
import { AlertCard } from '../components/alerts/AlertCard';
import { Bell, ShieldAlert, Filter, CheckCircle2, RefreshCw } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100 flex items-center gap-3">
            Alert Center
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-lg animate-pulse">
                {criticalCount} Critical
              </span>
            )}
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Real-time fraud alert orchestration and threat acknowledgement</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {(['ALL', 'OPEN', 'CRITICAL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="text-emerald-400" size={20} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Resolution Rate</h3>
            </div>
            <div className="text-3xl font-black text-white">
              {alerts.length > 0
                ? Math.round((alerts.filter(a => a.status === 'ACKNOWLEDGED').length / alerts.length) * 100)
                : 0}%
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">of last 50 threats cleared</p>
          </div>

          <div className="p-6 rounded-2xl border border-red-500/20 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <ShieldAlert className="text-red-400" size={20} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">High Risk Pool</h3>
            </div>
            <div className="text-3xl font-black text-white">
              {alerts.filter(a => a.fraudScore > 0.85).length}
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Pending investigation</p>
          </div>
        </div>

        {/* Alerts Stream */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl">
              <RefreshCw className="text-slate-700 animate-spin mb-4" size={32} />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Syncing with threat engine...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl">
              <Bell className="text-slate-800 mb-4" size={48} />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center">
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