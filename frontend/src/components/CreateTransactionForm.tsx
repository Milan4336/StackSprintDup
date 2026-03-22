import { FormEvent, useState } from 'react';
import axios from 'axios';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types';

interface CreateTransactionFormProps {
  onCreated?: (transaction: Transaction) => void;
}

export const CreateTransactionForm = ({ onCreated }: CreateTransactionFormProps) => {
  const { createTransaction, creating } = useTransactions();

  const [userId, setUserId] = useState('user-001');
  const [amount, setAmount] = useState(350);
  const [location, setLocation] = useState('NY');
  const [deviceId, setDeviceId] = useState('device-ui-001');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const transaction = await createTransaction({
        userId: userId.trim(),
        amount: Number(amount),
        location: location.trim(),
        deviceId: deviceId.trim()
      });

      setSuccess(`Created ${transaction.transactionId} with ${transaction.riskLevel} risk (${transaction.fraudScore}).`);
      onCreated?.(transaction);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { error?: string } | undefined)?.error || err.message || 'Failed to create transaction');
      } else {
        setError('Failed to create transaction');
      }
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl backdrop-blur sm:grid-cols-2 xl:grid-cols-5"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">User ID</span>
        <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} required />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Amount</span>
        <input className="input" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location</span>
        <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} required />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Device ID</span>
        <input className="input" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required />
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={creating}
          className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {creating ? 'Submitting...' : 'Create'}
        </button>
      </div>

      {error ? (
        <p className="sm:col-span-2 xl:col-span-5 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">{error}</p>
      ) : null}

      {success ? (
        <p className="sm:col-span-2 xl:col-span-5 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">{success}</p>
      ) : null}
    </form>
  );
};
