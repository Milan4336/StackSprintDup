import { create } from 'zustand';

export type ActivityEventType = 'transaction' | 'alert' | 'simulation' | 'system' | 'case' | 'ml';
export type ActivitySeverity = 'info' | 'warning' | 'critical';
export type ActivityFeedFilter = 'all' | ActivityEventType;

export interface ActivityFeedItem {
  id: string;
  type: ActivityEventType;
  severity: ActivitySeverity;
  message: string;
  timestamp: string;
}

const MAX_FEED_ITEMS = 200;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const toIso = (value: unknown): string => {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
};

const nextId = (): string => `feed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeSocketEvent = (channel: string, payload: unknown): ActivityFeedItem | null => {
  const obj = asRecord(payload);

  if (channel === 'transactions.live') {
    const riskLevel = typeof obj?.riskLevel === 'string' ? obj.riskLevel : 'Low';
    const fraudScore = typeof obj?.fraudScore === 'number' ? obj.fraudScore : 0;
    const txId = typeof obj?.transactionId === 'string' ? obj.transactionId : 'unknown';
    const userId = typeof obj?.userId === 'string' ? obj.userId : 'unknown-user';
    const isHigh = riskLevel === 'High' || fraudScore >= 71;

    return {
      id: nextId(),
      type: 'transaction',
      severity: isHigh ? 'critical' : 'info',
      message: isHigh
        ? `New high-risk transaction detected (${txId}) for ${userId}.`
        : `Transaction processed (${txId}) for ${userId}.`,
      timestamp: toIso(obj?.timestamp)
    };
  }

  if (channel === 'fraud.alerts') {
    const alertId = typeof obj?.alertId === 'string' ? obj.alertId : 'unknown-alert';
    const riskLevel = typeof obj?.riskLevel === 'string' ? obj.riskLevel : 'High';
    const userId = typeof obj?.userId === 'string' ? obj.userId : 'unknown-user';

    return {
      id: nextId(),
      type: 'alert',
      severity: 'critical',
      message: `Alert generated (${alertId}) for ${userId} with ${riskLevel} risk.`,
      timestamp: toIso(obj?.createdAt ?? obj?.timestamp)
    };
  }

  if (channel === 'simulation.events') {
    const eventType = typeof obj?.type === 'string' ? obj.type : 'simulation.event';
    const count = typeof obj?.count === 'number' ? obj.count : undefined;
    const started = eventType.includes('started');
    const completed = eventType.includes('completed');
    const message = started
      ? `Simulation started${count ? ` (${count} events)` : ''}.`
      : completed
        ? `Simulation completed${count ? ` (${count} events)` : ''}.`
        : `Simulation event received (${eventType}).`;

    return {
      id: nextId(),
      type: 'simulation',
      severity: 'info',
      message,
      timestamp: toIso(obj?.startedAt ?? obj?.completedAt ?? obj?.timestamp)
    };
  }

  if (channel === 'system.status') {
    const status = typeof obj?.status === 'string' ? obj.status : 'unknown';
    const mlStatus = typeof obj?.mlStatus === 'string' ? obj.mlStatus : null;

    let severity: ActivitySeverity = 'info';
    if (mlStatus === 'DEGRADED') severity = 'warning';
    if (mlStatus === 'OFFLINE') severity = 'critical';

    return {
      id: nextId(),
      type: 'system',
      severity,
      message: mlStatus
        ? `System status: ${status}. ML status ${mlStatus}.`
        : `System status: ${status}.`,
      timestamp: toIso(obj?.at ?? obj?.timestamp)
    };
  }

  return null;
};

interface ActivityFeedStoreState {
  items: ActivityFeedItem[];
  paused: boolean;
  filter: ActivityFeedFilter;
  isOpen: boolean;
  addEvent: (event: Omit<ActivityFeedItem, 'id'>) => void;
  addSocketEvent: (channel: string, payload: unknown) => void;
  addCaseEvent: (input: { action: 'created' | 'assigned' | 'updated'; caseId: string; investigatorId?: string }) => void;
  addMlStatusEvent: (input: { previous: string; next: string }) => void;
  setPaused: (paused: boolean) => void;
  setFilter: (filter: ActivityFeedFilter) => void;
  toggleOpen: () => void;
  clear: () => void;
}

export const useActivityFeedStore = create<ActivityFeedStoreState>((set) => ({
  items: [],
  paused: false,
  filter: 'all',
  isOpen: true,

  addEvent: (event) => {
    set((state) => ({
      items: [...state.items, { ...event, id: nextId() }].slice(-MAX_FEED_ITEMS)
    }));
  },

  addSocketEvent: (channel, payload) => {
    const normalized = normalizeSocketEvent(channel, payload);
    if (!normalized) return;
    set((state) => ({
      items: [...state.items, normalized].slice(-MAX_FEED_ITEMS)
    }));
  },

  addCaseEvent: ({ action, caseId, investigatorId }) => {
    const event: ActivityFeedItem = {
      id: nextId(),
      type: 'case',
      severity: action === 'assigned' ? 'warning' : 'info',
      message:
        action === 'created'
          ? `Case created (${caseId}).`
          : action === 'assigned'
            ? `Case assigned (${caseId}) to ${investigatorId ?? 'analyst'}.`
            : `Case updated (${caseId}).`,
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      items: [...state.items, event].slice(-MAX_FEED_ITEMS)
    }));
  },

  addMlStatusEvent: ({ previous, next }) => {
    if (previous === next) return;
    const severity: ActivitySeverity = next === 'OFFLINE' ? 'critical' : next === 'DEGRADED' ? 'warning' : 'info';
    const event: ActivityFeedItem = {
      id: nextId(),
      type: 'ml',
      severity,
      message: `ML status changed: ${previous} -> ${next}.`,
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      items: [...state.items, event].slice(-MAX_FEED_ITEMS)
    }));
  },

  setPaused: (paused) => set({ paused }),
  setFilter: (filter) => set({ filter }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  clear: () => set({ items: [] })
}));

