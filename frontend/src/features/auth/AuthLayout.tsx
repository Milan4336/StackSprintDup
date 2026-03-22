import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footerText: string;
  footerActionLabel: string;
  footerActionTo: string;
  children: ReactNode;
}

export const AuthLayout = ({
  title,
  subtitle,
  footerText,
  footerActionLabel,
  footerActionTo,
  children
}: AuthLayoutProps) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe,_#ffffff_40%,_#f8fafc)] px-4 py-12">
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Fraud Detection Platform</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

      <div className="mt-6">{children}</div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {footerText}{' '}
        <Link to={footerActionTo} className="font-semibold text-brand-700 hover:text-brand-800">
          {footerActionLabel}
        </Link>
      </p>
    </div>
  </div>
);
