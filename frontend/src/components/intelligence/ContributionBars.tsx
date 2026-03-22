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
                            <span className="theme-muted-text">{item.feature.replace('_', ' ')}</span>
                            <span style={{ color: isPositive ? 'var(--status-danger)' : 'var(--status-success)' }}>
                                {isPositive ? '+' : ''}{item.weight.toFixed(3)}
                            </span>
                        </div>
                        <div
                            className="relative flex h-2 w-full overflow-hidden rounded-full"
                            style={{ background: 'color-mix(in srgb, var(--surface-3) 92%, transparent)' }}
                        >
                            {/* Center line for zero */}
                            <div
                                className="absolute bottom-0 left-1/2 top-0 z-10 w-px"
                                style={{ background: 'color-mix(in srgb, var(--surface-border) 80%, transparent)' }}
                            />

                            <div className="flex-1 flex justify-end">
                                {!isPositive && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="h-full rounded-l-full"
                                        style={{ background: 'color-mix(in srgb, var(--status-success) 70%, transparent)' }}
                                    />
                                )}
                            </div>
                            <div className="flex-1 flex justify-start">
                                {isPositive && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="h-full rounded-r-full"
                                        style={{ background: 'color-mix(in srgb, var(--status-danger) 70%, transparent)' }}
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
