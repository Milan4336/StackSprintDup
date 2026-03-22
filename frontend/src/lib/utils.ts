import { RiskLevel } from '../types';
import { formatSafeDate } from '../utils/date';

export const formatCurrency = (amount: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount);

export const formatDateTime = (value: string): string => formatSafeDate(value);

export const riskColor = (risk: RiskLevel): string => {
  switch (risk) {
    case 'High':
      return 'text-risk-high bg-red-50 ring-red-200';
    case 'Medium':
      return 'text-risk-medium bg-amber-50 ring-amber-200';
    case 'Low':
      return 'text-risk-low bg-emerald-50 ring-emerald-200';
    default:
      return 'text-slate-600 bg-slate-100 ring-slate-200';
  }
};

export const generateTransactionId = (): string => `tx-ui-${Date.now()}`;
