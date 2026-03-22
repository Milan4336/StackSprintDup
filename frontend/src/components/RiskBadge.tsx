import { RiskLevel } from '../types';

interface RiskBadgeProps {
  value: RiskLevel;
}

const toneMap: Record<RiskLevel, string> = {
  Low: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  Medium: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  High: 'bg-red-500/15 text-red-300 ring-red-400/30'
};

export const RiskBadge = ({ value }: RiskBadgeProps) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneMap[value]}`}>
    {value}
  </span>
);
