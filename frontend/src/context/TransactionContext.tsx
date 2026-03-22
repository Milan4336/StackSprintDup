import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { Socket } from 'socket.io-client';
import { apiClient, monitoringApi } from '../api/client';
import { connectSocket, getSocket } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { RiskLevel, Transaction, TransactionStats } from '../types';
import { safeDate } from '../utils/date';

interface CreateTransactionInput {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
}

interface TransactionContextValue {
  transactions: Transaction[];
  stats: TransactionStats | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  lastUpdated: string | null;
  fetchTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

const nextTxId = (): string => `tx-ui-${Date.now()}`;

const computeStatsFromTransactions = (transactions: Transaction[]): TransactionStats => {
  const total = transactions.length;
  const fraudCount = transactions.filter((tx) => tx.isFraud).length;
  const avgRiskScore = total ? transactions.reduce((sum, tx) => sum + tx.fraudScore, 0) / total : 0;

  const highRiskUsersMap = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.riskLevel !== 'High') continue;
    highRiskUsersMap.set(tx.userId, (highRiskUsersMap.get(tx.userId) ?? 0) + 1);
  }

  const highRiskUsers = Array.from(highRiskUsersMap.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    fraudRate: total ? fraudCount / total : 0,
    avgRiskScore,
    highRiskUsers
  };
};

const normalizeTransaction = (raw: Partial<Transaction>): Transaction => {
  const timestamp = safeDate(raw.timestamp)?.toISOString() ?? new Date().toISOString();
  const riskLevel = (raw.riskLevel as RiskLevel | undefined) ?? 'Low';

  return {
    transactionId: raw.transactionId || `event-${Date.now()}`,
    userId: raw.userId || 'unknown-user',
    amount: Number(raw.amount ?? 0),
    currency: raw.currency || 'USD',
    location: raw.location || 'Unknown',
    latitude: typeof raw.latitude === 'number' ? raw.latitude : undefined,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : undefined,
    deviceId: raw.deviceId || 'unknown-device',
    ipAddress: raw.ipAddress || '0.0.0.0',
    timestamp,
    fraudScore: Number(raw.fraudScore ?? 0),
    riskLevel,
    isFraud: Boolean(raw.isFraud ?? riskLevel === 'High'),
    explanations: raw.explanations
  };
};

const upsertTransaction = (transactions: Transaction[], raw: Partial<Transaction>): Transaction[] => {
  const next = normalizeTransaction(raw);
  return [next, ...transactions.filter((tx) => tx.transactionId !== next.transactionId)].slice(0, 600);
};

const parseArrayResponse = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
};

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refreshTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const [transactionsResult, statsResult] = await Promise.allSettled([
        monitoringApi.getTransactions(500),
        monitoringApi.getStats()
      ]);

      let nextTransactions: Transaction[] | null = null;
      if (transactionsResult.status === 'fulfilled') {
        nextTransactions = parseArrayResponse<Transaction>(transactionsResult.value).map((tx) => normalizeTransaction(tx));
        setTransactions(nextTransactions);
      } else {
        const reason = transactionsResult.reason;
        setError(reason instanceof Error ? reason.message : 'Failed to load transactions');
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else if (nextTransactions) {
        setStats(computeStatsFromTransactions(nextTransactions));
      } else {
        setTransactions((prev) => {
          setStats(computeStatsFromTransactions(prev));
          return prev;
        });
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh transactions');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => {
      const next = upsertTransaction(prev, transaction);
      setStats(computeStatsFromTransactions(next));
      setLastUpdated(new Date().toISOString());
      return next;
    });
  }, []);

  const createTransaction = useCallback(
    async (input: CreateTransactionInput) => {
      setCreating(true);
      setError(null);

      try {
        const response = await apiClient.post<Transaction>('/transactions', {
          transactionId: nextTxId(),
          userId: input.userId,
          amount: Number(input.amount),
          currency: 'USD',
          location: input.location,
          deviceId: input.deviceId,
          ipAddress: '127.0.0.1',
          timestamp: new Date().toISOString()
        });

        const created = normalizeTransaction(response.data);
        addTransaction(created);
        await refreshTransactions();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create transaction');
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [addTransaction, refreshTransactions]
  );

  const fetchTransactions = refreshTransactions;

  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions([]);
      setStats(null);
      setError(null);
      setLoading(false);
      setLastUpdated(null);
      return;
    }
    void fetchTransactions();
  }, [fetchTransactions, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = window.setInterval(() => {
      void refreshTransactions();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAuthenticated, refreshTransactions]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket: Socket = getSocket() ?? connectSocket();

    const onLiveTransaction = (payload: Partial<Transaction>) => {
      addTransaction(normalizeTransaction(payload));
    };

    socket.on('transactions.live', onLiveTransaction);

    return () => {
      socket.off('transactions.live', onLiveTransaction);
    };
  }, [addTransaction, isAuthenticated]);

  const value = useMemo<TransactionContextValue>(
    () => ({
      transactions,
      stats,
      loading,
      creating,
      error,
      lastUpdated,
      fetchTransactions,
      refreshTransactions,
      addTransaction,
      createTransaction
    }),
    [transactions, stats, loading, creating, error, lastUpdated, fetchTransactions, refreshTransactions, addTransaction, createTransaction]
  );

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};

export const useTransactions = (): TransactionContextValue => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used inside TransactionProvider');
  }
  return context;
};
