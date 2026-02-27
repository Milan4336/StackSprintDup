import axios from 'axios';
import {
  AlertInvestigation,
  AuditLog,
  CaseRecord,
  FraudAlert,
  FraudExplanationRecord,
  MlStatusSnapshot,
  ModelHealthPayload,
  ModelInfo,
  PaginatedResponse,
  SystemHealth,
  SystemSettings,
  Transaction,
  TransactionStats,
  UserDevice
} from '../types';
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
  async queryTransactions(params: {
    page?: number;
    limit?: number;
    search?: string;
    riskLevel?: string;
    userId?: string;
    deviceId?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Transaction>> {
    const { data } = await apiClient.get<PaginatedResponse<Transaction>>('/transactions/query', { params });
    return data;
  },
  async getTransactionById(transactionId: string): Promise<Transaction> {
    const { data } = await apiClient.get<Transaction>(`/transactions/${transactionId}`);
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
  async queryAlerts(params: {
    page?: number;
    limit?: number;
    status?: 'open' | 'investigating' | 'resolved';
    search?: string;
  }): Promise<PaginatedResponse<FraudAlert>> {
    const { data } = await apiClient.get<PaginatedResponse<FraudAlert>>('/alerts', { params });
    return data;
  },
  async getAlertDetails(alertId: string): Promise<AlertInvestigation> {
    const { data } = await apiClient.get<AlertInvestigation>(`/alerts/${alertId}`);
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
  async getGraph(limit = 300): Promise<{ nodes: any[]; links: any[] }> {
    const { data } = await apiClient.get('/graph', { params: { limit } });
    return data;
  },
  async startSimulation(count = 50): Promise<{ generated: number }> {
    const { data } = await apiClient.post<{ generated: number }>('/simulation/start', { count });
    return data;
  },
  async getCases(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    transactionId?: string;
  }): Promise<PaginatedResponse<CaseRecord>> {
    const { data } = await apiClient.get<PaginatedResponse<CaseRecord>>('/cases', { params });
    return data;
  },
  async createCase(payload: {
    transactionId: string;
    alertId?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    notes?: string[];
  }): Promise<CaseRecord> {
    const { data } = await apiClient.post<CaseRecord>('/cases', payload);
    return data;
  },
  async updateCase(
    caseId: string,
    payload: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      note?: string;
    }
  ): Promise<CaseRecord> {
    const { data } = await apiClient.patch<CaseRecord>(`/cases/${caseId}`, payload);
    return data;
  },
  async getAudit(limit = 200): Promise<AuditLog[]> {
    const { data } = await apiClient.get<AuditLog[]>('/audit', { params: { limit } });
    return data;
  },
  async getModelInfo(): Promise<ModelInfo> {
    const { data } = await apiClient.get<ModelInfo>('/model/info');
    return data;
  },
  async getModelHealth(limit = 100): Promise<ModelHealthPayload> {
    const { data } = await apiClient.get<ModelHealthPayload>('/model/health', { params: { limit } });
    return data;
  },
  async getMlStatus(): Promise<MlStatusSnapshot> {
    const { data } = await apiClient.get<MlStatusSnapshot>('/system/ml-status');
    return data;
  },
  async getSystemHealth(): Promise<SystemHealth> {
    const { data } = await apiClient.get<SystemHealth>('/system/health');
    return data;
  },
  async getSettings(): Promise<SystemSettings> {
    const { data } = await apiClient.get<SystemSettings>('/settings');
    return data;
  },
  async updateSettings(payload: Partial<SystemSettings>): Promise<SystemSettings> {
    const { data } = await apiClient.patch<SystemSettings>('/settings', payload);
    return data;
  },
  async globalSearch(query: string): Promise<{
    transactions: Transaction[];
    users: Array<{ email: string; role: string; createdAt: string }>;
    alerts: FraudAlert[];
    cases: CaseRecord[];
  }> {
    const { data } = await apiClient.get('/search', { params: { q: query } });
    return data;
  },
  async retrainModel(): Promise<{ status: string; async: boolean }> {
    const { data } = await apiClient.post('/model/retrain', { async_mode: true });
    return data;
  }
};
