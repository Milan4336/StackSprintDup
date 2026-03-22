import axios from 'axios';
import { FraudAlert, FraudExplanationRecord, Transaction, TransactionStats, UserDevice } from '../types';
import { useAuthStore } from '../store/auth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const monitoringApi = {
  async getTransactions(limit = 300): Promise<Transaction[]> {
    const { data } = await apiClient.get<Transaction[]>('/transactions', { params: { limit } });
    return data;
  },
  async getStats(): Promise<TransactionStats> {
    const { data } = await apiClient.get<TransactionStats>('/transactions/stats');
    return data;
  },
  async getAlerts(limit = 120): Promise<FraudAlert[]> {
    const { data } = await apiClient.get<FraudAlert[]>('/alerts', { params: { limit } });
    return data;
  },
  async getDevices(limit = 200): Promise<UserDevice[]> {
    const { data } = await apiClient.get<UserDevice[]>('/devices', { params: { limit } });
    return data;
  },
  async getExplanations(limit = 120): Promise<FraudExplanationRecord[]> {
    const { data } = await apiClient.get<FraudExplanationRecord[]>('/explanations', { params: { limit } });
    return data;
  },
  async startSimulation(count = 50): Promise<{ generated: number }> {
    const { data } = await apiClient.post<{ generated: number }>('/simulation/start', { count });
    return data;
  }
};
