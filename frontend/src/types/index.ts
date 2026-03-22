export type UserRole = 'admin' | 'analyst';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type TransactionAction = 'ALLOW' | 'STEP_UP_AUTH' | 'BLOCK';
export type MlStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE';

export interface AuthResponse {
  token: string;
}

export interface LoginResponse {
  token?: string;
  userId?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
  message?: string;
}

export interface MfaStatusResponse {
  enabled: boolean;
  hasSecret: boolean;
  verifiedAt: string | null;
  issuer: string;
}

export interface MfaSetupResponse {
  enabled: boolean;
  issuer: string;
  accountName: string;
  secret: string;
  otpauthUrl: string;
}

export interface MfaVerifyResponse {
  verified?: boolean;
  enabled?: boolean;
  verifiedAt: string;
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
  city?: string;
  country?: string;
  deviceId: string;
  ipAddress: string;
  timestamp: string;
  action?: TransactionAction;
  ruleScore?: number;
  mlScore?: number;
  mlStatus?: MlStatus;
  modelVersion?: string;
  modelName?: string;
  modelConfidence?: number;
  modelScores?: Record<string, number>;
  modelWeights?: Record<string, number>;
  fraudScore: number;
  riskLevel: RiskLevel;
  isFraud: boolean;
  geoVelocityFlag?: boolean;
  ruleReasons?: string[];
  explanations?: FraudExplanation[];
  featureContributions?: FeatureContribution[];
  verificationStatus?: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  aiExplanation?: string;
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
  totalTransactions?: number;
  fraudTransactions?: number;
  fraudByCountry?: Array<{ country: string; fraudCount: number; total: number }>;
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

export interface FeatureContribution {
  feature: string;
  weight: number;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED';

export interface AlertRecord {
  _id?: string;
  alertId: string;
  transactionId: string;
  userId: string;
  fraudScore: number;
  severity: AlertSeverity;
  status: AlertStatus;
  channels: string[];
  payload: {
    amount: number;
    location: string;
    deviceHash: string;
    timestamp: string | Date;
    reasons: string[];
  };
  createdAt: string;
  updatedAt: string;
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

export interface AlertInvestigation {
  alert: FraudAlert;
  transaction: Transaction | null;
  userHistory: Transaction[];
  devices: UserDevice[];
  explanations: FraudExplanationRecord[];
  cases: CaseRecord[];
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

export interface DeviceIntelligence {
  _id?: string;
  deviceHash: string;
  userId: string;
  firstSeen: string;
  lastSeen: string;
  deviceTrustScore: number;
  deviceLabel: 'Trusted Device' | 'New Device' | 'Suspicious Device';
  deviceRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  userAgent?: string;
  platform?: string;
  timezone?: string;
  gpuVendor?: string;
  gpuRenderer?: string;
  deviceMemory?: string | number;
  cpuCores?: string | number;
  lastKnownIp?: string;
}

export interface FraudExplanationRecord {
  _id?: string;
  transactionId: string;
  userId: string;
  fraudScore: number;
  explanations: FraudExplanation[];
  featureContributions?: FeatureContribution[];
  aiExplanation?: string;
  createdAt: string;
}

export type CopilotSourceType = 'transaction' | 'alert' | 'case' | 'explanation' | 'system' | 'project';

export interface CopilotSource {
  id: string;
  type: CopilotSourceType;
  label: string;
  snippet: string;
}

export interface CopilotChatResponse {
  response: string;
  sources: CopilotSource[];
  suggestions: string[];
  mode?: 'gemini' | 'fallback';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type CaseStatus = 'NEW' | 'UNDER_INVESTIGATION' | 'ESCALATED' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CaseTimelineItem {
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface CaseRecord {
  _id?: string;
  caseId: string;
  transactionId: string;
  alertId?: string;
  investigatorId?: string;
  caseStatus: CaseStatus;
  priority: CasePriority;
  caseNotes: string[];
  evidenceFiles: string[];
  timeline: CaseTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id?: string;
  eventType: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface EnsembleModelMetadata {
  modelName: string;
  version: string;
  trainedAt: string;
  metrics: Record<string, number>;
  status: string;
}

export interface ModelInfo {
  models: EnsembleModelMetadata[];
  ensemble: {
    weights: Record<string, number>;
    fraud_threshold: number;
  }
}

export interface MlStatusSnapshot {
  status: MlStatus;
  failureCount: number;
  lastLatencyMs: number;
  lastError: string | null;
  circuitOpenUntil: string | null;
}

export interface ModelMetric {
  _id?: string;
  snapshotAt: string;
  fraudRate: number;
  avgFraudScore: number;
  scoreDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  inputDistribution: {
    avgAmount: number;
    uniqueDevices: number;
    uniqueLocations: number;
  };
  driftDetected: boolean;
  driftReason?: string;
}

export interface ModelHealthPayload {
  latest: ModelMetric | null;
  metrics: ModelMetric[];
}

export interface SystemHealth {
  timestamp: string;
  apiLatencyMs: number;
  mlLatencyMs: number;
  redisLatencyMs: number;
  mongoStatus: 'UP' | 'DOWN';
  redisStatus: 'UP' | 'DOWN';
  mlStatus: 'UP' | 'DOWN';
  websocketStatus: 'UP' | 'DOWN';
  websocketClients: number;
  containers: Array<{
    name: string;
    status: 'UP' | 'DOWN';
    rawStatus: string;
    cpuPercent: number;
    memoryUsageMb: number;
    memoryLimitMb: number;
    memoryPercent: number;
  }>;
}

export interface SystemSettings {
  key: string;
  highAmountThreshold: number;
  velocityWindowMinutes: number;
  velocityTxThreshold: number;
  scoreRuleWeight: number;
  scoreMlWeight: number;
  scoreBehaviorWeight: number;
  scoreGraphWeight: number;
  autonomousAlertThreshold: number;
  simulationMode: boolean;
  updatedBy?: string;
  updatedAt: string;
}

// ── Graph Intelligence ────────────────────────────────────────────────────────

export interface GraphNodeMetrics {
  nodeId: string;
  nodeType: 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION' | 'CARD';
  nodeDegree: number;
  fraudNeighborRatio: number;
  sharedDeviceCount: number;
  sharedIPCount: number;
  clusterDensity: number;
  triangleCount: number;
  graphScore: number;
  isFraudNeighbor: boolean;
  fraudScore: number;
}

export interface FraudCluster {
  clusterId: string;
  members: string[];
  sharedDevices: string[];
  sharedIPs: string[];
  avgFraudScore: number;
  size: number;
}

export interface GraphAnalytics {
  nodes: GraphNodeMetrics[];
  clusters: FraudCluster[];
  totalNodes: number;
  totalEdges: number;
}

/** Enriched D3 node coming from GET /graph */
export interface EnrichedGraphNode {
  id: string;
  type: 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION' | 'CARD';
  riskScore: number;
  fraudNeighborRatio: number;
  clusterDensity: number;
  graphScore: number;
  sharedDevices: number;
  sharedIPs: number;
  isFraudCluster: boolean;
  val: number;
}

