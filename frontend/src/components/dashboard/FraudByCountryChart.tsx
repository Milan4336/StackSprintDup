import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TransactionStats } from '../../types';

interface FraudByCountryChartProps {
  stats: TransactionStats | null;
}

const tooltipStyle = {
  background: 'rgba(15,23,42,0.94)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: 12,
  color: '#e2e8f0'
};

export const FraudByCountryChart = ({ stats }: FraudByCountryChartProps) => {
  const data = stats?.fraudByCountry ?? [];

  return (
    <motion.article className="panel h-[340px]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.12 }}>
      <h3 className="panel-title">Fraud by Country</h3>
      {data.length === 0 ? (
        <div className="app-empty h-[260px]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Country insights will appear after geo-resolved transactions are processed.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
            <XAxis dataKey="country" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
            />
            <Bar dataKey="fraudCount" fill="#ef4444" name="Fraud" radius={[8, 8, 0, 0]} />
            <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.article>
  );
};
