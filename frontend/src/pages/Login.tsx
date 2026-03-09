import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Fingerprint, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, monitoringApi } from '../api/client';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { useAuthStore } from '../store/auth';
import { useIntroStore } from '../store/intro';
import { SystemBootIntro } from '../components/intro/SystemBootIntro';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const setPendingIntro = useIntroStore((state) => state.setPendingIntro);

  const [email, setEmail] = useState('admin@fraud.local');
  const [password, setPassword] = useState('StrongPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBoot, setShowBoot] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const response = await apiClient.post<{ token: string }>('/auth/login', { email, password, deviceFingerprint });

      // Store token early for catch-all middleware or getMe()
      localStorage.setItem('token', response.data.token);

      const userProfile = await monitoringApi.getMe();

      setPendingIntro(false);
      login(response.data.token, userProfile);
      setShowBoot(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { error?: string } | undefined)?.error || 'Invalid credentials');
      } else {
        setError('Unable to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showBoot && <SystemBootIntro onComplete={() => navigate(from, { replace: true })} />}
      </AnimatePresence>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-16 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-red-500/12 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
          <motion.section initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="hidden rounded-3xl border border-slate-800/70 bg-slate-900/50 p-8 backdrop-blur lg:block">
            <p className="chip border-blue-500/40 bg-blue-500/10 text-blue-200">FraudOS Enterprise</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">Financial Threat Intelligence for Modern Banks</h1>
            <p className="mt-4 text-slate-300">
              Hybrid ML and rules, realtime geospatial radar, autonomous response, and investigation workflows in one command center.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-slate-200"><ShieldCheck size={16} className="text-emerald-400" /> SOC-grade fraud monitoring</p>
              <p className="flex items-center gap-2 text-slate-200"><Fingerprint size={16} className="text-blue-400" /> Device fingerprint intelligence</p>
              <p className="flex items-center gap-2 text-slate-200"><LockKeyhole size={16} className="text-amber-400" /> Secure JWT + RBAC access control</p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-8 shadow-2xl backdrop-blur"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Fraud Detection</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Sign in to Command Center</h2>
            <p className="mt-2 text-sm text-slate-400">Use your analyst or admin credentials to continue.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-200">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    className="w-full rounded-xl border border-slate-600 bg-slate-950/80 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none ring-blue-300 transition focus:border-blue-400 focus:ring"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-200">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    className="w-full rounded-xl border border-slate-600 bg-slate-950/80 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none ring-blue-300 transition focus:border-blue-400 focus:ring"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              {error ? <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-cyan-300"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </motion.section>
        </div>
      </div>
    </>
  );
};
