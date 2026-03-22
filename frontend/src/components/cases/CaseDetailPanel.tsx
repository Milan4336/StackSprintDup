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
            className="panel sticky top-6 flex h-[700px] flex-col overflow-hidden"
        >
            {/* Header Section */}
            <div className="mb-6 flex items-start justify-between border-b pb-4" style={{ borderColor: 'var(--surface-border)' }}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="theme-strong-text text-xs font-black uppercase tracking-widest italic">{fraudCase.caseId}</span>
                        <a
                            href={`/transactions/${fraudCase.transactionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="transition-colors"
                            style={{ color: 'var(--accent)' }}
                        >
                            <ExternalLink size={12} />
                        </a>
                    </div>
                    <div className="theme-muted-text text-[10px] font-bold uppercase tracking-tight">Investigation Profile</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <PriorityBadge priority={fraudCase.priority} />
                    <span className="theme-muted-text text-[9px]" style={{ fontFamily: 'var(--font-mono)' }}>Created: {formatSafeDate(fraudCase.createdAt)}</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                {/* Assignment & Status Control */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="theme-muted-text flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                            <User size={10} /> Active Investigator
                        </label>
                        <div className="flex gap-2">
                            <input
                                className="input flex-1 rounded-lg px-3 py-2 text-[10px]"
                                placeholder="analyst@stacksprint.ai"
                                value={investigatorInput}
                                onChange={e => setInvestigatorInput(e.target.value)}
                            />
                            <button
                                onClick={() => assignMutation.mutate(investigatorInput)}
                                disabled={assignMutation.isPending || investigatorInput === fraudCase.investigatorId}
                                className="theme-btn-secondary rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest"
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
                        <h4 className="theme-muted-text flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                            <FileText size={10} /> Forensic Evidence
                        </h4>
                        <button
                            onClick={() => {
                                const url = prompt('Enter evidence URL (S3/GCS bucket link):');
                                if (url) evidenceMutation.mutate(url);
                            }}
                            className="text-[9px] font-black uppercase tracking-widest italic"
                            style={{ color: 'var(--accent)' }}
                        >
                            + Attach Link
                        </button>
                    </div>
                    {fraudCase.evidenceFiles.length === 0 ? (
                        <div className="theme-empty-state rounded-xl p-3">
                            <p className="theme-muted-text text-[9px] font-bold uppercase tracking-tight italic">No digital evidence attached</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {fraudCase.evidenceFiles.map((file, i) => (
                                <a
                                    key={i}
                                    href={file}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all"
                                    style={{
                                        borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
                                        background: 'color-mix(in srgb, var(--accent) 10%, transparent)'
                                    }}
                                >
                                    <FileText size={12} style={{ color: 'var(--accent)' }} />
                                    <span className="text-[9px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--app-text-muted)' }}>{file.split('/').pop()}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Integration Notes Input */}
                <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--surface-border)' }}>
                    <label className="theme-muted-text text-[10px] font-black uppercase tracking-widest">Append Investigative Note</label>
                    <textarea
                        className="input h-20 w-full resize-none px-3 py-2 text-[10px] font-medium leading-relaxed"
                        placeholder="Log detailed findings, device signals, or external intelligence..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                    <button
                        disabled={!note.trim() || statusMutation.isPending}
                        onClick={() => statusMutation.mutate(fraudCase.caseStatus)}
                        className="theme-btn-secondary w-full py-2.5 text-[9px] font-black uppercase tracking-widest"
                    >
                        <Plus size={12} /> Commit Investigation Note
                    </button>
                </div>

                {/* Audit Timeline */}
                <div className="space-y-4 border-t pt-4" style={{ borderColor: 'var(--surface-border)' }}>
                    <h4 className="theme-muted-text text-[10px] font-black uppercase tracking-widest italic">Investigation Lifecycle</h4>
                    <div className="relative space-y-4 border-l-2 pl-4" style={{ borderColor: 'var(--surface-border)' }}>
                        {timelineReversed.map((item, i) => (
                            <div key={i} className="relative">
                                <span
                                    className="absolute -left-5 top-1 h-2 w-2 rounded-full"
                                    style={{
                                        background: i === 0 ? 'var(--status-danger)' : 'var(--app-text-muted)',
                                        boxShadow: i === 0 ? '0 0 8px color-mix(in srgb, var(--status-danger) 60%, transparent)' : undefined
                                    }}
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="theme-strong-text text-[9px] font-black uppercase tracking-tight">{item.action.replace(/_/g, ' ')}</span>
                                        <span className="theme-muted-text text-[8px]" style={{ fontFamily: 'var(--font-mono)' }}>[{formatSafeDate(item.at)}]</span>
                                    </div>
                                    <div className="theme-muted-text text-[8px] font-bold uppercase tracking-tighter italic">Analyst: {item.actor}</div>
                                    {item.note && (
                                        <p className="theme-muted-text mt-1 rounded-lg border p-2 text-[10px] font-medium leading-tight" style={{ background: 'var(--surface-3)', borderColor: 'var(--surface-border)' }}>
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
    const config: Record<string, string> = {
        LOW: 'var(--app-text-muted)',
        MEDIUM: 'var(--accent)',
        HIGH: 'var(--status-warning)',
        CRITICAL: 'var(--status-danger)'
    };
    const tone = config[priority] || config.MEDIUM;
    return (
        <span
            className={`rounded border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${priority === 'CRITICAL' ? 'animate-pulse' : ''}`}
            style={{
                color: tone,
                borderColor: `color-mix(in srgb, ${tone} 35%, transparent)`,
                background: `color-mix(in srgb, ${tone} 14%, transparent)`
            }}
        >
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
            className="flex items-center justify-center gap-1.5 rounded-lg border px-1 py-2 text-[9px] font-bold uppercase tracking-tighter transition-all"
            style={isActive
                ? {
                    background: 'color-mix(in srgb, var(--status-danger) 14%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--status-danger) 45%, transparent)',
                    color: 'var(--status-danger)',
                    boxShadow: '0 10px 20px -16px color-mix(in srgb, var(--status-danger) 50%, transparent)'
                }
                : {
                    background: 'var(--surface-3)',
                    borderColor: 'var(--surface-border)',
                    color: 'var(--app-text-muted)'
                }}
        >
            <Icon size={12} />
            {labels[status]}
        </button>
    );
};
