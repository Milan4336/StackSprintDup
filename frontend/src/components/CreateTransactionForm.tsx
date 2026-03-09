import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { DollarSign, LocateFixed, Smartphone, UserRound } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types';
import { ZeroTrustModal } from './transactions/ZeroTrustModal';

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
  const [pendingZeroTrustTx, setPendingZeroTrustTx] = useState<Transaction | null>(null);

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

      if (transaction.verificationStatus === 'PENDING') {
        setPendingZeroTrustTx(transaction);
        return;
      }

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

  const handleZeroTrustSuccess = () => {
    if (pendingZeroTrustTx) {
      setSuccess(`Created ${pendingZeroTrustTx.transactionId} with ${pendingZeroTrustTx.riskLevel} risk (${pendingZeroTrustTx.fraudScore}). Verification completed.`);
      onCreated?.({ ...pendingZeroTrustTx, verificationStatus: 'VERIFIED', action: 'ALLOW' });
      setPendingZeroTrustTx(null);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">User ID</span>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input className="input pl-8" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Amount</span>
        <div className="relative">
          <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input className="input pl-8" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Location</span>
        <div className="relative">
          <LocateFixed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input className="input pl-8" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Device ID</span>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input className="input pl-8" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required />
        </div>
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={creating}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-cyan-300"
        >
          {creating ? 'Submitting...' : 'Create Transaction'}
        </button>
      </div>

      {error ? (
        <p className="sm:col-span-2 xl:col-span-5 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">{error}</p>
      ) : null}

      {success ? (
        <p className="sm:col-span-2 xl:col-span-5 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">{success}</p>
      ) : null}

      {pendingZeroTrustTx && (
        <ZeroTrustModal
          transactionId={pendingZeroTrustTx.transactionId}
          amount={pendingZeroTrustTx.amount}
          onSuccess={handleZeroTrustSuccess}
          onClose={() => setPendingZeroTrustTx(null)}
        />
      )}
    </motion.form>
  );
};
