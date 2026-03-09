import React from 'react';
import { motion } from 'framer-motion';
import { FeatureContribution } from '../../types';

interface ContributionBarsProps {
    contributions: FeatureContribution[];
}

export const ContributionBars: React.FC<ContributionBarsProps> = ({ contributions }) => {
    const maxWeight = Math.max(...contributions.map(c => Math.abs(c.weight)), 0.1);

    return (
        <div className="space-y-4">
            {contributions.map((item, index) => {
                const percentage = (Math.abs(item.weight) / maxWeight) * 100;
                const isPositive = item.weight > 0;

                return (
                    <div key={item.feature} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                            <span className="text-slate-400">{item.feature.replace('_', ' ')}</span>
                            <span className={isPositive ? 'text-red-400' : 'text-emerald-400'}>
                                {isPositive ? '+' : ''}{item.weight.toFixed(3)}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
                            {/* Center line for zero */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700 z-10" />

                            <div className="flex-1 flex justify-end">
                                {!isPositive && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="h-full bg-emerald-500/60 rounded-l-full"
                                    />
                                )}
                            </div>
                            <div className="flex-1 flex justify-start">
                                {isPositive && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="h-full bg-red-500/60 rounded-r-full"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
