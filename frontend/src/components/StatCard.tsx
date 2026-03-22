import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}

export const StatCard = ({ label, value, hint, icon }: StatCardProps) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {icon ? <span className="text-brand-600">{icon}</span> : null}
    </div>
    <p className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
  </article>
);
