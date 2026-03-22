import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ApiErrorShape, AuthResponse, CreateTransactionPayload, Transaction, TransactionStats, UserRole } from '../types';

const resolveApiBase = (): string => {
  const configured =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8080';

  return configured.endsWith('/api/v1')
    ? configured
    : `${configured.replace(/\/$/, '')}/api/v1`;
};

const http = axios.create({
  baseURL: resolveApiBase(),
  timeout: 10_000
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const parseApiError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorShape | undefined;
    return new Error(payload?.error || error.message || 'Request failed');
  }
  return new Error('Unexpected error');
};

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(parseApiError(error));
  }
);

export const api = {
  async register(email: string, password: string, role: UserRole): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/register', { email, password, role });
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async getTransactions(limit = 200): Promise<Transaction[]> {
    const { data } = await http.get<Transaction[]>('/transactions', { params: { limit } });
    return data;
  },

  async getTransactionStats(): Promise<TransactionStats> {
    const { data } = await http.get<TransactionStats>('/transactions/stats');
    return data;
  },

  async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    const { data } = await http.post<Transaction>('/transactions', payload);
    return data;
  }
};
