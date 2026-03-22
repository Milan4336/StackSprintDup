import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '../../types';

interface RiskDistributionChartProps {
  transactions: Transaction[];
}

const tooltipStyle = {
  background: 'rgba(15,23,42,0.94)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: 12,
  color: '#e2e8f0'
};

export const RiskDistributionChart = ({ transactions }: RiskDistributionChartProps) => {
  const data = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    for (const tx of transactions) {
      counts[tx.riskLevel] += 1;
    }
    return [
      { risk: 'Low', count: counts.Low, fill: '#22c55e' },
      { risk: 'Medium', count: counts.Medium, fill: '#f59e0b' },
      { risk: 'High', count: counts.High, fill: '#ef4444' }
    ];
  }, [transactions]);

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.03 }}>
      <h3 className="panel-title">Risk Distribution Donut</h3>
      <div className="h-72">
        {data.every((item) => item.count === 0) ? (
          <div className="app-empty h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400">No transactions available for distribution analysis.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="risk"
                outerRadius={98}
                innerRadius={62}
                paddingAngle={3}
                stroke="transparent"
              >
                {data.map((entry) => (
                  <Cell key={entry.risk} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.article>
  );
};
