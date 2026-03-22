import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Filter,
  FileText,
  UserPlus,
  ShieldAlert,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { monitoringApi } from '../api/client';
import { useActivityFeedStore } from '../store/activityFeedStore';
import { CasePriority, CaseStatus, CaseRecord } from '../types';
import { formatSafeDate } from '../utils/date';
import { CaseDetailPanel } from '../components/cases/CaseDetailPanel';

export const Cases = () => {
  const queryClient = useQueryClient();
  const addCaseEvent = useActivityFeedStore((state) => state.addCaseEvent);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | ''>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    transactionId: '',
    investigatorId: '',
    status: 'NEW' as CaseStatus,
    priority: 'MEDIUM' as CasePriority,
    note: ''
  });

  const casesQuery = useQuery({
    queryKey: ['cases', page, statusFilter, priorityFilter],
    queryFn: () =>
      monitoringApi.getCases({
        page,
        limit: 15,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      }),
    refetchInterval: 10000
  });

  const selectedCase = useMemo(
    () => casesQuery.data?.data.find((item) => item.caseId === selectedCaseId) ?? null,
    [casesQuery.data, selectedCaseId]
  );

  const createCaseMutation = useMutation({
    mutationFn: () =>
      monitoringApi.createCase({
        transactionId: createForm.transactionId,
        investigatorId: createForm.investigatorId || undefined,
        status: createForm.status,
        priority: createForm.priority,
        notes: createForm.note ? [createForm.note] : undefined
      }),
    onSuccess: async (createdCase) => {
      addCaseEvent({
        action: 'created',
        caseId: createdCase.caseId,
        investigatorId: createdCase.investigatorId
      });
      setCreateForm({
        transactionId: '',
        investigatorId: '',
        status: 'NEW',
        priority: 'MEDIUM',
        note: ''
      });
      setShowCreateModal(false);
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
    }
  });

  const stats = useMemo(() => {
    if (!casesQuery.data) return { open: 0, assigned: 0, resolved: 0, fraudLoss: 0 };
    const all = casesQuery.data.data;
    return {
      open: all.filter(c => c.caseStatus === 'NEW').length,
      assigned: all.filter(c => c.caseStatus === 'UNDER_INVESTIGATION' || c.caseStatus === 'ESCALATED').length,
      resolved: all.filter(c => c.caseStatus === 'RESOLVED').length,
      fraudLoss: 14250.00 // Simulated metric for UI
    };
  }, [casesQuery.data]);

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.transactionId.trim()) return;
    createCaseMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="page-kicker">Investigation Ops</span>
          <h1 className="theme-page-title">Case Management</h1>
          <p className="theme-page-subtitle">Investigations, evidence gathering, and fraud resolution operations.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="theme-btn-danger text-xs uppercase tracking-widest"
        >
          <Briefcase size={14} />
          Initialize New Case
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Open Cases"
          value={stats.open}
          icon={AlertTriangle}
          tone="warning"
        />
        <MetricCard
          label="Under Investigation"
          value={stats.assigned}
          icon={Clock}
          tone="accent"
        />
        <MetricCard
          label="Resolved (7d)"
          value={stats.resolved}
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Estimated Fraud Loss"
          value={`$${stats.fraudLoss.toLocaleString()}`}
          icon={TrendingDown}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Case Queue */}
        <div className="panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--surface-border)' }}>
            <h3 className="panel-title mb-0 text-sm uppercase tracking-widest italic">Investigation Queue</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--app-text-muted)' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="input appearance-none pl-9 py-1.5 pr-4 text-[10px] font-bold uppercase tracking-tight"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="UNDER_INVESTIGATION">Investigating</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="CONFIRMED_FRAUD">Fraud</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="relative">
                <ShieldAlert size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--app-text-muted)' }} />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="input appearance-none pl-9 py-1.5 pr-4 text-[10px] font-bold uppercase tracking-tight"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-shell overflow-x-auto rounded-xl">
            <table className="min-w-full text-left">
              <thead className="theme-table-head text-[10px] font-black uppercase tracking-widest italic">
                <tr>
                  <th className="px-5 py-4">State</th>
                  <th className="px-5 py-4">Case ID</th>
                  <th className="px-5 py-4">Signals</th>
                  <th className="px-5 py-4">Analyst</th>
                  <th className="px-5 py-4 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {casesQuery.data?.data.map((item) => (
                  <tr
                    key={item.caseId}
                    onClick={() => setSelectedCaseId(item.caseId)}
                    className={`theme-table-row group cursor-pointer ${selectedCaseId === item.caseId ? 'theme-table-row-selected' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <StatusBadge status={item.caseStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold uppercase tracking-tighter theme-strong-text" style={{ fontFamily: 'var(--font-mono)' }}>
                        {item.caseId}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase theme-muted-text">TX: {item.transactionId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <PriorityIcon priority={item.priority} />
                        {item.evidenceFiles.length > 0 && (
                          <span
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black uppercase"
                            style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
                          >
                            <FileText size={10} /> {item.evidenceFiles.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold theme-muted-text">
                        <UserPlus size={12} style={{ color: 'var(--app-text-muted)' }} />
                        {item.investigatorId || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="text-[10px] theme-muted-text" style={{ fontFamily: 'var(--font-mono)' }}>{formatSafeDate(item.updatedAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-[10px] font-black uppercase tracking-widest italic theme-muted-text">
              Displaying {casesQuery.data?.total || 0} cases
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="theme-btn-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!casesQuery.data || page >= casesQuery.data.pages}
                onClick={() => setPage(p => p + 1)}
                className="theme-btn-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Selected Case Detail */}
        <AnimatePresence mode="wait">
          {selectedCase ? (
            <CaseDetailPanel
              key={selectedCase.caseId}
              fraudCase={selectedCase}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="theme-empty-state h-[600px] space-y-4"
            >
              <div className="rounded-full p-4" style={{ background: 'color-mix(in srgb, var(--surface-2) 75%, transparent)', color: 'var(--app-text-muted)' }}>
                <ShieldAlert size={48} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest theme-muted-text">No Selection</h4>
                <p className="mt-1 px-12 text-[10px] font-bold uppercase leading-relaxed theme-muted-text">
                  Select an investigative case from the queue to view timeline, evidence, and take action.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Initialize Case Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="theme-modal-backdrop absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="theme-modal-panel relative w-full max-w-xl rounded-2xl p-6"
            >
              <h2 className="mb-6 flex items-center gap-2 text-lg font-black uppercase tracking-tighter italic theme-strong-text">
                <Plus style={{ color: 'var(--status-danger)' }} /> Initialize Investigation
              </h2>

              <form onSubmit={onCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest theme-muted-text">Transaction ID</label>
                    <input
                      required
                      className="input px-4 py-3 text-xs"
                      placeholder="e.g. TX_8231..."
                      value={createForm.transactionId}
                      onChange={e => setCreateForm(f => ({ ...f, transactionId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest theme-muted-text">Priority Override</label>
                    <select
                      className="input px-4 py-3 text-xs"
                      value={createForm.priority}
                      onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value as any }))}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest theme-muted-text">Initial Investigator</label>
                  <input
                    className="input px-4 py-3 text-xs"
                    placeholder="analyst@stacksprint.ai"
                    value={createForm.investigatorId}
                    onChange={e => setCreateForm(f => ({ ...f, investigatorId: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest theme-muted-text">Opening Brief</label>
                  <textarea
                    className="input h-24 resize-none px-4 py-3 text-xs"
                    placeholder="Describe suspicious behavior or reason for case opening..."
                    value={createForm.note}
                    onChange={e => setCreateForm(f => ({ ...f, note: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 border-t pt-4" style={{ borderColor: 'var(--surface-border)' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="theme-btn-secondary flex-1 py-3 text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCaseMutation.isPending}
                    className="theme-btn-danger flex-1 py-3 text-[10px] font-black uppercase tracking-widest"
                  >
                    {createCaseMutation.isPending ? 'Processing...' : 'Deploy Case'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Components ─────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, icon: Icon, tone }: any) => {
  const toneClass: Record<string, string> = {
    accent: 'theme-stat-card-accent',
    success: 'theme-stat-card-success',
    warning: 'theme-stat-card-accent',
    danger: 'theme-stat-card-danger'
  };
  const toneColor: Record<string, string> = {
    accent: 'var(--accent)',
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)'
  };

  const resolvedTone = toneColor[tone] ?? 'var(--accent)';

  return (
    <div className={`theme-stat-card ${toneClass[tone] ?? 'theme-stat-card-accent'} flex items-center gap-4`}>
      <div
        className="rounded-xl p-3"
        style={{
          background: `color-mix(in srgb, ${resolvedTone} 14%, transparent)`,
          color: resolvedTone
        }}
      >
      <Icon size={20} />
      </div>
      <div>
        <p className="theme-stat-label">{label}</p>
        <p className="text-xl font-black italic theme-strong-text">{value}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: CaseStatus }) => {
  const config: Record<string, { label: string; color: string }> = {
    NEW: { label: 'New', color: 'var(--status-warning)' },
    UNDER_INVESTIGATION: { label: 'Investigation', color: 'var(--accent)' },
    ESCALATED: { label: 'Escalated', color: 'var(--status-danger)' },
    CONFIRMED_FRAUD: { label: 'Fraud', color: 'var(--status-danger)' },
    FALSE_POSITIVE: { label: 'Clean', color: 'var(--status-success)' },
    RESOLVED: { label: 'Resolved', color: 'var(--app-text-muted)' }
  };
  const { label, color } = config[status] || config.NEW;
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        background: `color-mix(in srgb, ${color} 14%, transparent)`
      }}
    >
      {label}
    </span>
  );
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    LOW: 'var(--app-text-muted)',
    MEDIUM: 'var(--accent)',
    HIGH: 'var(--status-warning)',
    CRITICAL: 'var(--status-danger)'
  };
  const color = colors[priority] ?? colors.MEDIUM;
  return (
    <div className={`flex items-center gap-1 ${priority === 'CRITICAL' ? 'animate-pulse' : ''}`} style={{ color }}>
      <ShieldAlert size={12} />
      <span className="text-[9px] font-black tracking-tighter uppercase">{priority}</span>
    </div>
  );
};
