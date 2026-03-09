import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Search,
  Filter,
  FileText,
  UserPlus,
  ShieldAlert,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Case Management</h1>
          <p className="section-subtitle mt-1">Investigations, evidence gathering, and fraud resolution operations.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all"
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
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricCard
          label="Under Investigation"
          value={stats.assigned}
          icon={Clock}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricCard
          label="Resolved (7d)"
          value={stats.resolved}
          icon={CheckCircle2}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricCard
          label="Estimated Fraud Loss"
          value={`$${stats.fraudLoss.toLocaleString()}`}
          icon={TrendingDown}
          color="text-red-500"
          bg="bg-red-500/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Case Queue */}
        <div className="panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/50 pb-4">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest italic">Investigation Queue</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400 appearance-none focus:border-red-500/50 outline-none"
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
                <ShieldAlert size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400 appearance-none focus:border-red-500/50 outline-none"
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

          <div className="overflow-x-auto rounded-xl border border-slate-800/50 bg-slate-900/30">
            <table className="min-w-full text-left">
              <thead className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500 italic">
                <tr>
                  <th className="px-5 py-4">State</th>
                  <th className="px-5 py-4">Case ID</th>
                  <th className="px-5 py-4">Signals</th>
                  <th className="px-5 py-4">Analyst</th>
                  <th className="px-5 py-4 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {casesQuery.data?.data.map((item) => (
                  <tr
                    key={item.caseId}
                    onClick={() => setSelectedCaseId(item.caseId)}
                    className={`group cursor-pointer hover:bg-slate-800/30 transition-colors ${selectedCaseId === item.caseId ? 'bg-red-500/5 border-l-2 border-red-500' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <StatusBadge status={item.caseStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-bold text-slate-100 uppercase tracking-tighter">
                        {item.caseId}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">TX: {item.transactionId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <PriorityIcon priority={item.priority} />
                        {item.evidenceFiles.length > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                            <FileText size={10} /> {item.evidenceFiles.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                        <UserPlus size={12} className="text-slate-600" />
                        {item.investigatorId || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-mono text-[10px] text-slate-500">{formatSafeDate(item.updatedAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
              Displaying {casesQuery.data?.total || 0} cases
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-tight text-slate-400 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!casesQuery.data || page >= casesQuery.data.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold uppercase tracking-tight text-slate-400 disabled:opacity-50"
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
              className="panel h-[600px] flex flex-col items-center justify-center text-center space-y-4 border-dashed"
            >
              <div className="p-4 rounded-full bg-slate-800/50 text-slate-600">
                <ShieldAlert size={48} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Selection</h4>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 leading-relaxed px-12">
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
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6"
            >
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-tighter italic flex items-center gap-2 mb-6">
                <Plus className="text-red-500" /> Initialize Investigation
              </h2>

              <form onSubmit={onCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction ID</label>
                    <input
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-red-500/50"
                      placeholder="e.g. TX_8231..."
                      value={createForm.transactionId}
                      onChange={e => setCreateForm(f => ({ ...f, transactionId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority Override</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-red-500/50"
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Investigator</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-red-500/50"
                    placeholder="analyst@stacksprint.ai"
                    value={createForm.investigatorId}
                    onChange={e => setCreateForm(f => ({ ...f, investigatorId: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Opening Brief</label>
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-red-500/50 h-24 resize-none"
                    placeholder="Describe suspicious behavior or reason for case opening..."
                    value={createForm.note}
                    onChange={e => setCreateForm(f => ({ ...f, note: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-300 uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCaseMutation.isPending}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-red-900/20"
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

const MetricCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="panel flex items-center gap-4 bg-slate-900/40">
    <div className={`p-3 rounded-xl ${bg} ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-100 italic">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: CaseStatus }) => {
  const config: Record<string, { label: string, color: string, bg: string }> = {
    NEW: { label: 'New', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    UNDER_INVESTIGATION: { label: 'Investigation', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ESCALATED: { label: 'Escalated', color: 'text-red-500', bg: 'bg-red-500/10' },
    CONFIRMED_FRAUD: { label: 'Fraud', color: 'text-red-600', bg: 'bg-red-600/10' },
    FALSE_POSITIVE: { label: 'Clean', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    RESOLVED: { label: 'Resolved', color: 'text-slate-500', bg: 'bg-white/5' },
  };
  const { label, color, bg } = config[status] || config.NEW;
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${color} ${bg} border border-current/10`}>
      {label}
    </span>
  );
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  const colors: any = { LOW: 'text-slate-600', MEDIUM: 'text-blue-400', HIGH: 'text-amber-500', CRITICAL: 'text-red-600 animate-pulse' };
  return (
    <div className={`flex items-center gap-1 ${colors[priority]}`}>
      <ShieldAlert size={12} />
      <span className="text-[9px] font-black tracking-tighter uppercase">{priority}</span>
    </div>
  );
};
