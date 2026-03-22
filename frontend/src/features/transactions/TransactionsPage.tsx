import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { RiskBadge } from '../../components/RiskBadge';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime, generateTransactionId } from '../../lib/utils';
import { CreateTransactionPayload, RiskLevel, Transaction } from '../../types';
import { safeDate } from '../../utils/date';

const toLocalDateTimeValue = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const defaultPayload = (): CreateTransactionPayload => ({
  transactionId: generateTransactionId(),
  userId: 'user-001',
  amount: 250,
  currency: 'USD',
  location: 'NY',
  deviceId: 'device-ui-001',
  ipAddress: '127.0.0.1',
  timestamp: toLocalDateTimeValue(new Date())
});

export const TransactionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<CreateTransactionPayload>(defaultPayload);

  const [query, setQuery] = useState('');
  const [fraudOnly, setFraudOnly] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getTransactions(300);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (fraudOnly && !tx.isFraud) return false;
      if (riskFilter !== 'all' && tx.riskLevel !== riskFilter) return false;
      if (!normalized) return true;

      return [tx.transactionId, tx.userId, tx.location, tx.deviceId]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [transactions, query, fraudOnly, riskFilter]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSuccess(null);

    try {
      const created = await api.createTransaction({
        ...form,
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
        timestamp: safeDate(form.timestamp)?.toISOString() ?? new Date().toISOString()
      });
      setTransactions((prev) => [created, ...prev]);
      setSuccess(`Transaction ${created.transactionId} created with ${created.riskLevel} risk score ${created.fraudScore}.`);
      setForm(defaultPayload());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading transactions..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Create Transaction</h2>
        <p className="mt-1 text-sm text-slate-500">Submit transactions directly from UI; backend applies rules + ML scoring automatically.</p>

        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            value={form.transactionId}
            onChange={(e) => setForm((prev) => ({ ...prev, transactionId: e.target.value }))}
            className="input"
            placeholder="Transaction ID"
            required
          />
          <input
            value={form.userId}
            onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
            className="input"
            placeholder="User ID"
            required
          />
          <input
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
            className="input"
            type="number"
            min={1}
            placeholder="Amount"
            required
          />
          <input
            value={form.currency}
            onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            className="input"
            maxLength={3}
            placeholder="Currency"
            required
          />
          <input
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            className="input"
            placeholder="Location"
            required
          />
          <input
            value={form.deviceId}
            onChange={(e) => setForm((prev) => ({ ...prev, deviceId: e.target.value }))}
            className="input"
            placeholder="Device ID"
            required
          />
          <input
            value={form.ipAddress}
            onChange={(e) => setForm((prev) => ({ ...prev, ipAddress: e.target.value }))}
            className="input"
            placeholder="IP Address"
            required
          />
          <input
            value={form.timestamp}
            onChange={(e) => setForm((prev) => ({ ...prev, timestamp: e.target.value }))}
            className="input"
            type="datetime-local"
            required
          />

          <div className="sm:col-span-2 xl:col-span-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {submitting ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>

        {submitError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{submitError}</p> : null}
        {success ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{success}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input max-w-sm"
            placeholder="Search by tx/user/location/device"
          />

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={fraudOnly} onChange={(e) => setFraudOnly(e.target.checked)} />
            Fraud only
          </label>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as 'all' | RiskLevel)}
            className="input w-40"
          >
            <option value="all">All risks</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="border-b border-slate-200 px-3 py-3">Transaction</th>
                <th className="border-b border-slate-200 px-3 py-3">User</th>
                <th className="border-b border-slate-200 px-3 py-3">Amount</th>
                <th className="border-b border-slate-200 px-3 py-3">Location</th>
                <th className="border-b border-slate-200 px-3 py-3">Fraud Score</th>
                <th className="border-b border-slate-200 px-3 py-3">Risk</th>
                <th className="border-b border-slate-200 px-3 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.transactionId} className="hover:bg-slate-50/80">
                  <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">{tx.transactionId}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{tx.userId}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{formatCurrency(tx.amount, tx.currency)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{tx.location}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{tx.fraudScore}</td>
                  <td className="border-b border-slate-100 px-3 py-3">
                    <RiskBadge value={tx.riskLevel} />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{formatDateTime(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No transactions match the current filters.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
};
