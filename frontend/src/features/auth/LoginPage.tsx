import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AuthLayout } from './AuthLayout';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useAuthStore((state) => state.setToken);

  const [email, setEmail] = useState('admin@fraud.local');
  const [password, setPassword] = useState('StrongPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.login(email.trim(), password);
      setToken(response.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Access live fraud monitoring, transaction controls, and risk analytics."
      footerText="New to the platform?"
      footerActionLabel="Create account"
      footerActionTo="/register"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
          />
        </label>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Demo credentials are prefilled. Use <Link to="/register" className="underline">register</Link> if not created.
      </p>
    </AuthLayout>
  );
};
