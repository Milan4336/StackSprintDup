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
  UserDevice,
  DeviceIntelligence,
  GraphAnalytics,
  AlertRecord,
  CaseStatus,
  CasePriority,
  EnrichedGraphNode,
  CopilotChatResponse,
  LoginResponse,
  MfaSetupResponse,
  MfaStatusResponse,
  MfaVerifyResponse
} from '../types';
import { useAuthStore } from '../store/auth';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000
});

apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach device fingerprint hash to stateful requests
  if (config.url?.includes('/auth/') || config.url?.includes('/simulation') || config.url?.includes('/transactions')) {
    try {
      const fp = await generateDeviceFingerprint();
      config.headers['X-Device-Fingerprint'] = btoa(JSON.stringify(fp));
    } catch (e) { }
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
  async getMe(): Promise<{
    userId: string;
    email: string;
    role: string;
    status: string;
    riskScore: number;
    lastLogin?: string;
    mfaEnabled?: boolean;
    mfaVerifiedAt?: string | null;
  }> {
    const fp = await generateDeviceFingerprint();
    const { data } = await apiClient.post('/auth/me', { deviceFingerprint: fp });
    return data;
  },
  async login(payload: { email: string; password: string; deviceFingerprint?: unknown }): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },
  async getMfaStatus(): Promise<MfaStatusResponse> {
    const { data } = await apiClient.get<MfaStatusResponse>('/auth/mfa/status');
    return data;
  },
  async setupMfa(): Promise<MfaSetupResponse> {
    const { data } = await apiClient.post<MfaSetupResponse>('/auth/mfa/setup');
    return data;
  },
  async enableMfa(code: string): Promise<MfaVerifyResponse> {
    const { data } = await apiClient.post<MfaVerifyResponse>('/auth/mfa/enable', { code });
    return data;
  },
  async verifyMfa(code: string, reason?: string): Promise<MfaVerifyResponse> {
    const { data } = await apiClient.post<MfaVerifyResponse>('/auth/mfa/verify', { code, reason });
    return data;
  },
  async verifyMfaWithChallenge(code: string, mfaToken: string): Promise<MfaVerifyResponse> {
    const { data } = await apiClient.post<MfaVerifyResponse>(
      '/auth/mfa/verify',
      { code, reason: 'LOGIN_CHALLENGE' },
      { headers: { Authorization: `Bearer ${mfaToken}` } }
    );
    return data;
  },
  async getEntity(id: string): Promise<any> {
    const { data } = await apiClient.get(`/entities/${id}`);
    return data;
  },
  async getTimeline(id: string): Promise<any[]> {
    const { data } = await apiClient.get(`/timeline/${id}`);
    return data;
  },
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
  async getDeviceIntelligence(limit = 200): Promise<DeviceIntelligence[]> {
    const { data } = await apiClient.get<DeviceIntelligence[]>('/devices/intelligence', { params: { limit } });
    return data;
  },
  async getExplanations(limit = 120): Promise<FraudExplanationRecord[]> {
    const { data } = await apiClient.get<FraudExplanationRecord[]>('/explanations', { params: { limit } });
    return data;
  },
  async getGraph(limit = 300): Promise<{ nodes: EnrichedGraphNode[]; links: any[]; clusters: any[] }> {
    const { data } = await apiClient.get('/graph', { params: { limit } });
    return data;
  },
  async getGraphAnalytics(): Promise<GraphAnalytics> {
    const { data } = await apiClient.get<GraphAnalytics>('/graph/analytics');
    return data;
  },
  async startSimulation(count = 50): Promise<{ generated: number }> {
    const { data } = await apiClient.post<{ generated: number }>('/simulation/start', { count });
    return data;
  },
  async simulateFraud(params: { attackType: string; volume: number; intensity: number }): Promise<{ message: string; taskId: string }> {
    const { data } = await apiClient.post<{ message: string; taskId: string }>('/simulation/fraud', params);
    return data;
  },
  async getCases(params: {
    page?: number;
    limit?: number;
    status?: string | CaseStatus;
    priority?: string | CasePriority;
    investigatorId?: string;
    transactionId?: string;
  }): Promise<PaginatedResponse<CaseRecord>> {
    const { data } = await apiClient.get<PaginatedResponse<CaseRecord>>('/cases', { params });
    return data;
  },
  async createCase(payload: {
    transactionId: string;
    alertId?: string;
    investigatorId?: string;
    status?: string | CaseStatus;
    priority?: string | CasePriority;
    notes?: string[];
  }): Promise<CaseRecord> {
    const { data } = await apiClient.post<CaseRecord>('/cases', payload);
    return data;
  },
  async updateCaseStatus(
    caseId: string,
    status: CaseStatus,
    note?: string
  ): Promise<CaseRecord> {
    const { data } = await apiClient.patch<CaseRecord>(`/cases/${caseId}/status`, { status, note });
    return data;
  },
  async assignCase(
    caseId: string,
    investigatorId: string
  ): Promise<CaseRecord> {
    const { data } = await apiClient.post<CaseRecord>(`/cases/${caseId}/assign`, { investigatorId });
    return data;
  },
  async addCaseEvidence(
    caseId: string,
    fileUrl: string
  ): Promise<CaseRecord> {
    const { data } = await apiClient.post<CaseRecord>(`/cases/${caseId}/evidence`, { fileUrl });
    return data;
  },
  // Legacy updateCase - keeping for compatibility but preferring specific methods
  async updateCase(
    caseId: string,
    payload: {
      status?: string;
      priority?: string;
      investigatorId?: string;
      note?: string;
    }
  ): Promise<CaseRecord> {
    const { data } = await apiClient.patch<CaseRecord>(`/cases/${caseId}/status`, payload);
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
  async updateModelConfig(
    payload: { weights?: Record<string, number>; fraud_threshold?: number }
  ): Promise<any> {
    const { data } = await apiClient.patch('/model/config', payload);
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
  async getSystemUpdates(): Promise<any[]> {
    const { data } = await apiClient.get<any[]>('/system/updates');
    return data;
  },
  async getDashboardModelConfidence(): Promise<{ time: string; value: number }[]> {
    const { data } = await apiClient.get<{ time: string; value: number }[]>('/dashboard/model-confidence');
    return data;
  },
  async getDashboardDrift(): Promise<{ time: string; value: number }[]> {
    const { data } = await apiClient.get<{ time: string; value: number }[]>('/dashboard/drift');
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
  async retrainModel(): Promise<{ message: string; status: string }> {
    const { data } = await apiClient.post('/model/retrain', { async_mode: true });
    return data;
  },

  async getModelRegistry(modelName = 'xgboost'): Promise<any[]> {
    const { data } = await apiClient.get('/model/registry', { params: { modelName } });
    return data;
  },

  async getModelStats(): Promise<any> {
    const { data } = await apiClient.get('/model/stats');
    return data;
  },

  // Dashboard intelligence endpoints
  async getDashboardOverview(): Promise<{
    transactionCount: number;
    fraudCount: number;
    alertCount: number;
    threatIndex: number;
    fraudRate: number;
    velocity: number;
    riskDistribution: { Low: number; Medium: number; High: number };
    systemHealth: string;
    lastUpdated: string;
  }> {
    const { data } = await apiClient.get('/dashboard/overview');
    return data;
  },
  async getGeoIntensity(): Promise<{ lat: number; lng: number; risk: number }[]> {
    const { data } = await apiClient.get('/dashboard/geo-intensity');
    return data;
  },
  async getRiskTrend(): Promise<{ time: string; value: number }[]> {
    const { data } = await apiClient.get('/dashboard/risk-trend');
    return data;
  },
  async getRiskDistribution(): Promise<{ Low: number; Medium: number; High: number }> {
    const { data } = await apiClient.get('/dashboard/risk-distribution');
    return data;
  },
  async getFraudTrend(): Promise<{ time: string; fraudCount: number; total: number; blocked: number; fraudRate: number }[]> {
    const { data } = await apiClient.get('/dashboard/fraud-trend');
    return data;
  },
  async getAnalyticsVelocity(): Promise<{ time: string; value: number }[]> {
    const { data } = await apiClient.get('/dashboard/velocity');
    return data;
  },
  async unfreezeUser(userId: string): Promise<any> {
    const { data } = await apiClient.post('/admin/unfreeze-user', { userId });
    return data;
  },
  async unfreezeDevice(deviceId: string): Promise<any> {
    const { data } = await apiClient.post('/admin/unfreeze-device', { deviceId });
    return data;
  },
  async releaseTransaction(transactionId: string): Promise<any> {
    const { data } = await apiClient.post('/admin/release-transaction', { transactionId });
    return data;
  },
  async getLiveAlerts(limit = 50): Promise<AlertRecord[]> {
    const { data } = await apiClient.get<AlertRecord[]>('/alerts/live', { params: { limit } });
    return data;
  },
  async acknowledgeAlert(alertId: string): Promise<AlertRecord> {
    const { data } = await apiClient.patch<AlertRecord>(`/alerts/${alertId}/acknowledge`);
    return data;
  },
  async copilotChat(message: string): Promise<CopilotChatResponse> {
    const { data } = await apiClient.post<CopilotChatResponse | { response: string }>('/copilot/chat', { message });

    if (typeof (data as CopilotChatResponse).response === 'string') {
      const typed = data as Partial<CopilotChatResponse>;
      return {
        response: typed.response ?? '',
        sources: Array.isArray(typed.sources) ? typed.sources : [],
        suggestions: Array.isArray(typed.suggestions) ? typed.suggestions : [],
        mode: typed.mode
      };
    }

    return {
      response: 'Copilot returned an unexpected payload.',
      sources: [],
      suggestions: [],
      mode: 'fallback'
    };
  }
};
