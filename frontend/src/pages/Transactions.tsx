import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { CreateTransactionForm } from '../components/CreateTransactionForm';
import { ErrorState } from '../components/ErrorState';
import { RiskBadge } from '../components/RiskBadge';
import { ForensicDetailModal } from '../components/transactions/ForensicDetailModal';
import { monitoringApi } from '../api/client';
import { formatSafeDate } from '../utils/date';
import { Transaction } from '../types';

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
        style={style}
        onClick={() => setSelectedTxId(tx.transactionId)}
        className={[
          'grid cursor-pointer grid-cols-[1.2fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr_0.3fr] items-center px-3 text-sm table-row',
          selectedTxId === tx.transactionId ? 'ring-1 ring-blue-400/50' : ''
        ].join(' ')}
      >
        <p className="truncate font-semibold text-blue-700 dark:text-blue-100">{tx.transactionId}</p>
        <p className="truncate text-slate-700 dark:text-slate-300">{tx.userId}</p>
        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{money.format(tx.amount)}</p>
        <p className="truncate text-slate-700 dark:text-slate-300">{tx.location}</p>
        <p className="truncate text-slate-700 dark:text-slate-200">{tx.fraudScore}</p>
        <p>
          <RiskBadge value={tx.riskLevel} />
        </p>
        <p className="truncate text-slate-700 dark:text-slate-200">{tx.action ?? 'N/A'}</p>
        <p className="truncate text-slate-500 dark:text-slate-400">{formatSafeDate(tx.timestamp)}</p>
        <p className={tx.isFraud ? 'text-red-400' : 'text-emerald-400'}>{tx.isFraud ? '●' : '●'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Transaction Management</h2>
            <p className="section-subtitle mt-1">Enterprise transaction monitoring with advanced filters, sorting, and investigation.</p>
          </div>
          <button className="glass-btn" onClick={() => query.refetch()}>
            <RefreshCw size={14} />
            Refresh Feed
          </button>
        </div>
      </motion.section>

      <section>
        <h2 className="mb-3 section-title">Create Transaction</h2>
        <CreateTransactionForm />
      </section>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="panel">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          <SlidersHorizontal size={14} />
          Filter Controls
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input className="input pl-9" placeholder="Search transaction, user, device, location..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
      </motion.section>

      {query.isError ? (
        <ErrorState
          message="Failed to load transaction feed."
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : null}

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="panel">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="panel-title mb-0">Realtime Transaction Table</h3>
          <span className="chip">{query.data?.total ?? 0} records</span>
        </div>

        <div className="table-shell">
          <div className="grid grid-cols-[1.2fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_1.1fr_0.3fr] bg-slate-100/95 px-3 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400">
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
              <AlertTriangle className="text-slate-400" size={20} />
              <p className="text-sm text-slate-500 dark:text-slate-400">No transactions match current filters.</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <p>
            Page {query.data?.page ?? page} of {query.data?.pages ?? 1}
          </p>
          <div className="flex gap-2">
            <button className="glass-btn" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Previous
            </button>
            <button
              className="glass-btn"
              disabled={page >= (query.data?.pages ?? 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="panel">
        <h3 className="panel-title">Transaction Investigation Panel</h3>
        {!selected ? (
          <div className="app-empty">
            <Search className="text-slate-400" size={20} />
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a transaction for detailed investigation.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">Transaction ID: <span className="font-semibold">{selected.transactionId}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">User: <span className="font-semibold">{selected.userId}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Device: <span className="font-semibold">{selected.deviceId}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Action: <span className="font-semibold">{selected.action ?? 'N/A'}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Rule Score: <span className="font-semibold">{selected.ruleScore ?? 'N/A'}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">ML Score: <span className="font-semibold">{selected.mlScore ?? 'N/A'}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">ML Status: <span className="font-semibold">{selected.mlStatus ?? 'N/A'}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Model: <span className="font-semibold">{selected.modelName ?? 'N/A'} {selected.modelVersion ?? ''}</span></p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Geo Velocity Flag: <span className="font-semibold">{selected.geoVelocityFlag ? 'Yes' : 'No'}</span></p>
            <div className="md:col-span-2 xl:col-span-3 pt-2">
              <button
                onClick={() => setShowForensicModal(true)}
                className="glass-btn border-blue-500/40 text-blue-500 hover:bg-blue-500 hover:text-white font-black text-xs uppercase tracking-widest px-6 py-2.5"
              >
                Deep Forensic Investigation
              </button>
            </div>
          </div>
        )}
      </motion.section>

      <ForensicDetailModal
        transaction={selected}
        onClose={() => setShowForensicModal(false)}
      />
    </div>
  );
};
