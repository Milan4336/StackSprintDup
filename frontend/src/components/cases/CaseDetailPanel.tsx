import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserPlus,
    FileText,
    ShieldAlert,
    ChevronRight,
    Activity,
    CheckCircle2,
    AlertTriangle,
    Plus,
    Clock,
    User,
    ExternalLink
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { CaseRecord, CaseStatus } from '../../types';
import { formatSafeDate } from '../../utils/date';

interface CaseDetailPanelProps {
    fraudCase: CaseRecord;
    onUpdate: () => void;
}

export const CaseDetailPanel = ({ fraudCase, onUpdate }: CaseDetailPanelProps) => {
    const queryClient = useQueryClient();
    const [note, setNote] = useState('');
    const [investigatorInput, setInvestigatorInput] = useState(fraudCase.investigatorId || '');

    const statusMutation = useMutation({
        mutationFn: (status: CaseStatus) =>
            monitoringApi.updateCaseStatus(fraudCase.caseId, status, note.trim() || undefined),
        onSuccess: () => {
            setNote('');
            onUpdate();
        }
    });

    const assignMutation = useMutation({
        mutationFn: (investigatorId: string) =>
            monitoringApi.assignCase(fraudCase.caseId, investigatorId),
        onSuccess: () => {
            onUpdate();
        }
    });

    const evidenceMutation = useMutation({
        mutationFn: (fileUrl: string) =>
            monitoringApi.addCaseEvidence(fraudCase.caseId, fileUrl),
        onSuccess: () => {
            onUpdate();
        }
    });

    const timelineReversed = [...fraudCase.timeline].reverse();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="panel bg-slate-900/40 border border-slate-800/50 flex flex-col h-[700px] overflow-hidden sticky top-6"
        >
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6 border-b border-slate-800/50 pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-widest italic">{fraudCase.caseId}</span>
                        <a
                            href={`/transactions/${fraudCase.transactionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <ExternalLink size={12} />
                        </a>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Investigation Profile</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <PriorityBadge priority={fraudCase.priority} />
                    <span className="text-[9px] font-mono text-slate-600">Created: {formatSafeDate(fraudCase.createdAt)}</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
                {/* Assignment & Status Control */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <User size={10} /> Active Investigator
                        </label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-100 outline-none focus:border-red-500/50"
                                placeholder="analyst@stacksprint.ai"
                                value={investigatorInput}
                                onChange={e => setInvestigatorInput(e.target.value)}
                            />
                            <button
                                onClick={() => assignMutation.mutate(investigatorInput)}
                                disabled={assignMutation.isPending || investigatorInput === fraudCase.investigatorId}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-[9px] font-black text-slate-300 uppercase tracking-widest rounded-lg transition-all"
                            >
                                <UserPlus size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <StatusActionBtn
                            status="UNDER_INVESTIGATION"
                            current={fraudCase.caseStatus}
                            icon={Clock}
                            onClick={() => statusMutation.mutate('UNDER_INVESTIGATION')}
                        />
                        <StatusActionBtn
                            status="ESCALATED"
                            current={fraudCase.caseStatus}
                            icon={AlertTriangle}
                            onClick={() => statusMutation.mutate('ESCALATED')}
                        />
                        <StatusActionBtn
                            status="CONFIRMED_FRAUD"
                            current={fraudCase.caseStatus}
                            icon={ShieldAlert}
                            onClick={() => statusMutation.mutate('CONFIRMED_FRAUD')}
                        />
                        <StatusActionBtn
                            status="RESOLVED"
                            current={fraudCase.caseStatus}
                            icon={CheckCircle2}
                            onClick={() => statusMutation.mutate('RESOLVED')}
                        />
                    </div>
                </div>

                {/* Evidence Attachments */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <FileText size={10} /> Forensic Evidence
                        </h4>
                        <button
                            onClick={() => {
                                const url = prompt('Enter evidence URL (S3/GCS bucket link):');
                                if (url) evidenceMutation.mutate(url);
                            }}
                            className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest italic"
                        >
                            + Attach Link
                        </button>
                    </div>
                    {fraudCase.evidenceFiles.length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight italic">No digital evidence attached</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {fraudCase.evidenceFiles.map((file, i) => (
                                <a
                                    key={i}
                                    href={file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-2 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg group transition-all"
                                >
                                    <FileText size={12} className="text-blue-500" />
                                    <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-slate-200">{file.split('/').pop()}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Integration Notes Input */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Append Investigative Note</label>
                    <textarea
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 outline-none focus:border-red-500/50 h-20 resize-none font-medium leading-relaxed"
                        placeholder="Log detailed findings, device signals, or external intelligence..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                    <button
                        disabled={!note.trim() || statusMutation.isPending}
                        onClick={() => statusMutation.mutate(fraudCase.caseStatus)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        <Plus size={12} /> Commit Investigation Note
                    </button>
                </div>

                {/* Audit Timeline */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Investigation Lifecycle</h4>
                    <div className="relative space-y-4 pl-4 border-l-2 border-slate-800">
                        {timelineReversed.map((item, i) => (
                            <div key={i} className="relative">
                                <span className={`absolute -left-5 top-1 w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-700'}`} />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-slate-100 uppercase tracking-tight">{item.action.replace(/_/g, ' ')}</span>
                                        <span className="text-[8px] font-mono text-slate-600">[{formatSafeDate(item.at)}]</span>
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter italic">Analyst: {item.actor}</div>
                                    {item.note && (
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800/30">
                                            {item.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const config: any = {
        LOW: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
        MEDIUM: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        HIGH: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/20 border-red-500/40 animate-pulse'
    };
    return (
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${config[priority] || config.MEDIUM}`}>
            {priority} Priority
        </span>
    );
};

const StatusActionBtn = ({ status, current, icon: Icon, onClick }: any) => {
    const isActive = current === status;
    const labels: any = {
        UNDER_INVESTIGATION: 'Investigate',
        ESCALATED: 'Escalate',
        CONFIRMED_FRAUD: 'Confirm Fraud',
        RESOLVED: 'Resolve Case',
        FALSE_POSITIVE: 'Safe/Clean'
    };

    return (
        <button
            onClick={onClick}
            disabled={isActive}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border text-[9px] font-bold uppercase tracking-tighter transition-all ${isActive
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 cursor-default shadow-lg shadow-red-900/10'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 active:scale-95'
                }`}
        >
            <Icon size={12} />
            {labels[status]}
        </button>
    );
};
