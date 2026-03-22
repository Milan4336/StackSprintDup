import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { ErrorState } from '../components/ErrorState';
import { RiskBadge } from '../components/RiskBadge';
import { ForensicDetailModal } from '../components/transactions/ForensicDetailModal';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';
import { Transaction } from '../types';
import { TransactionAura } from '../components/visual/TransactionAura';
import { HUDPanel, HUDDataReadout } from '../components/visual/HUDDecorations';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const Transactions = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [userId, setUserId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'fraudScore' | 'riskLevel' | 'createdAt'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [showForensicModal, setShowForensicModal] = useState(false);

  const query = useQuery({
    queryKey: [
      'transactions-query',
      page,
      search,
      riskLevel,
      userId,
      deviceId,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy,
      sortOrder
    ],
    queryFn: () =>
      monitoringApi.queryTransactions({
        page,
        limit: 25,
        search: search || undefined,
        riskLevel: riskLevel || undefined,
        userId: userId || undefined,
        deviceId: deviceId || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder
      }),
    refetchInterval: 5000
  });

  const selected = useMemo(
    () => query.data?.data.find((item) => item.transactionId === selectedTxId) ?? null,
    [query.data, selectedTxId]
  );
  const rows = query.data?.data ?? [];

  const Row = ({ index, style }: ListChildComponentProps) => {
    const tx: Transaction = rows[index];
    if (!tx) return null;

    return (
      <div
        style={{
          ...style,
          ...(selectedTxId === tx.transactionId
            ? { boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 65%, transparent) inset' }
            : {})
        }}
        onClick={() => setSelectedTxId(tx.transactionId)}
        className={[
          'grid cursor-pointer grid-cols-[1.2fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr_0.3fr] items-center px-3 text-sm table-row relative',
          selectedTxId === tx.transactionId ? 'ring-1' : ''
        ].join(' ')}
      >
        <TransactionAura riskScore={tx.fraudScore || 0} />
        <p className="relative z-10 truncate font-semibold" style={{ color: 'var(--accent)' }}>{tx.transactionId}</p>
        <p className="relative z-10 truncate">{tx.userId}</p>
        <p className="theme-strong-text relative z-10 truncate font-semibold">{money.format(tx.amount)}</p>
        <p className="relative z-10 truncate">{tx.location}</p>
        <p className="relative z-10 truncate">{tx.fraudScore}</p>
        <p className="relative z-10">
          <RiskBadge value={tx.riskLevel} />
        </p>
        <p className="relative z-10 truncate">{tx.action ?? 'N/A'}</p>
        <p className="theme-muted-text relative z-10 truncate">{formatSafeDate(tx.timestamp)}</p>
        <div className="relative z-10 flex justify-center">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    (window as any).showForensicReplay?.(tx.transactionId);
                }}
                className="h-2 w-2 rounded-full hover:scale-150 transition-transform cursor-pointer"
                style={{ background: tx.isFraud ? 'var(--status-danger)' : 'var(--status-success)' }}
                title="Execute Forensic Replay"
            />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <HUDPanel title="Management Controller">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex gap-4">
              <HUDDataReadout label="Module" value="Transactional Forensics" />
              <HUDDataReadout label="Access" value="L4 Investigator" />
              <HUDDataReadout label="State" value="Real-time Feed" />
            </div>
            <p className="section-subtitle mt-2">Enterprise monitoring with advanced filters and investigation vectors.</p>
          </div>
          <button className="theme-btn-secondary" onClick={() => query.refetch()}>
            <RefreshCw size={14} className="animate-spin-slow" />
            Refresh Intelligence
          </button>
        </div>
      </HUDPanel>

      <section>
        <HUDPanel title="Entry Vector Console">
          <CreateTransactionForm />
        </HUDPanel>
      </section>

      <HUDPanel title="Filtering Matrix">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>
          <SlidersHorizontal size={14} />
          Filter Parameter Injection
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 theme-muted-text" size={15} />
            <input className="input pl-9" placeholder="Search user, device, hash..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className="input" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input className="input" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <input className="input" placeholder="Device ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
          <input className="input" type="number" placeholder="Min Amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          <input className="input" type="number" placeholder="Max Amount" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          <input className="input" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input className="input" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="timestamp">Sort: Timestamp</option>
            <option value="amount">Sort: Amount</option>
            <option value="fraudScore">Sort: Fraud Score</option>
            <option value="riskLevel">Sort: Risk Level</option>
            <option value="createdAt">Sort: Created At</option>
          </select>
          <select className="input" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </HUDPanel>

      {
        query.isError ? (
          <ErrorState
            message="Failed to load transaction feed."
            onRetry={() => {
              void query.refetch();
            }}
          />
        ) : null
      }

      <HUDPanel title="Transactional Stream Processor">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-4">
            <HUDDataReadout label="Buffer" value={`${query.data?.total ?? 0} blocks`} />
            <HUDDataReadout label="Latency" value="< 50ms" />
          </div>
        </div>

        <div className="table-shell">
          <div className="theme-table-head grid grid-cols-[1.2fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr_0.3fr] px-3 py-3 text-left text-xs uppercase tracking-[0.16em] backdrop-blur">
            <p>Transaction</p>
            <p>User</p>
            <p>Amount</p>
            <p>Location</p>
            <p>Risk Score</p>
            <p>Risk</p>
            <p>Action</p>
            <p>Time</p>
            <p>F</p>
          </div>

          {query.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-11" />
              ))}
            </div>
          ) : rows.length > 0 ? (
            <FixedSizeList height={460} itemCount={rows.length} itemSize={52} width="100%">
              {Row}
            </FixedSizeList>
          ) : (
            <div className="app-empty m-3">
              <AlertTriangle className="theme-muted-text" size={20} />
              <p className="theme-muted-text text-sm">No transactions match current filters.</p>
            </div>
          )}
        </div>

        <div className="theme-muted-text mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <p>
            Sector {query.data?.page ?? page} / {query.data?.pages ?? 1}
          </p>
          <div className="flex gap-2">
            <button className="theme-btn-secondary text-[10px]" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              PREV BLOCK
            </button>
            <button
              className="theme-btn-secondary text-[10px]"
              disabled={page >= (query.data?.pages ?? 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              NEXT BLOCK
            </button>
          </div>
        </div>
      </HUDPanel>

      <HUDPanel title="Deep Forensic Triage">
        {!selected ? (
          <div className="app-empty border-white/5">
            <Search size={32} style={{ color: 'color-mix(in srgb, var(--accent) 45%, transparent)' }} />
            <p className="hud-readout mt-2">Initialize sector scan to select entity</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <HUDDataReadout label="IDENTIFIER" value={selected.transactionId} />
            <HUDDataReadout label="ENTITY_ID" value={selected.userId} />
            <HUDDataReadout label="HARDWARE_ID" value={selected.deviceId} />
            <HUDDataReadout label="RESPONSE_ACTION" value={selected.action ?? 'N/A'} />
            <HUDDataReadout label="HEURISTIC_SCORE" value={selected.ruleScore ?? 'N/A'} />
            <HUDDataReadout label="NEURAL_SCORE" value={selected.mlScore ?? 'N/A'} />
            <HUDDataReadout label="MODEL_VECTOR" value={`${selected.modelName ?? 'N/A'} ${selected.modelVersion ?? ''}`} />
            <HUDDataReadout label="GEO_ANOMALY" value={selected.geoVelocityFlag ? 'TRIPPED' : 'CLEAR'} />

            <div className="md:col-span-2 lg:col-span-4 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowForensicModal(true)}
                className="theme-btn-primary w-full py-3 text-xs font-black uppercase tracking-[0.2em] group"
              >
                <span className="group-hover:scale-110 transition-transform inline-block">Execute Deep Forensic Probe</span>
              </button>
            </div>
          </div>
        )}
      </HUDPanel>

      <AnimatePresence>
        {showForensicModal && selected && (
          <ForensicDetailModal
            transaction={selected}
            onClose={() => setShowForensicModal(false)}
          />
        )}
      </AnimatePresence>
    </div >
  );
};
