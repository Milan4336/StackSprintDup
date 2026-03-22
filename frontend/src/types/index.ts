export type UserRole = 'admin' | 'analyst';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface AuthResponse {
  token: string;
}

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
}

export interface Transaction {
  _id?: string;
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  deviceId: string;
  ipAddress: string;
  timestamp: string;
  fraudScore: number;
  riskLevel: RiskLevel;
  isFraud: boolean;
  explanations?: FraudExplanation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionPayload {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  deviceId: string;
  ipAddress: string;
  timestamp: string;
}

export interface TransactionStats {
  fraudRate: number;
  avgRiskScore: number;
  highRiskUsers: Array<{ userId: string; count: number }>;
}

export interface ApiErrorShape {
  error: string;
  requestId?: string;
  details?: unknown;
}

export interface FraudExplanation {
  feature: string;
  impact: number;
  reason: string;
}

export interface FraudAlert {
  _id?: string;
  alertId: string;
  transactionId: string;
  userId: string;
  fraudScore: number;
  riskLevel: RiskLevel;
  reason: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
}

export interface UserDevice {
  _id?: string;
  userId: string;
  deviceId: string;
  location: string;
  firstSeen: string;
  lastSeen: string;
  txCount: number;
  isSuspicious: boolean;
  riskLevel: RiskLevel;
}

export interface FraudExplanationRecord {
  _id?: string;
  transactionId: string;
  userId: string;
  fraudScore: number;
  explanations: FraudExplanation[];
  createdAt: string;
}
