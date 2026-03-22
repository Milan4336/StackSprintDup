import React, { useId } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FeatureContribution } from '../../types';

interface FeatureImportanceChartProps {
    data: FeatureContribution[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
    const chartId = useId();
    const readVar = (name: string, fallback: string): string => {
        if (typeof window === 'undefined') return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    };
    const muted = readVar('--app-text-muted', '#94a3b8');
    const strong = readVar('--app-text-strong', '#f8fafc');
    const surface = readVar('--surface-3', '#0f172a');
    const border = readVar('--surface-border', '#334155');
    const danger = readVar('--status-danger', '#ef4444');
    const success = readVar('--status-success', '#22c55e');

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={border} horizontal={false} />
                    <XAxis
                        type="number"
                        stroke={muted}
                        fontSize={12}
                        tickFormatter={(value) => value.toFixed(2)}
                    />
                    <YAxis
                        dataKey="feature"
                        type="category"
                        stroke={muted}
                        fontSize={12}
                        width={100}
                    />
                    <Tooltip
                        contentStyle={{
                            background: `color-mix(in srgb, ${surface} 88%, black 12%)`,
                            border: `1px solid ${border}`,
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: strong }}
                        labelStyle={{ color: muted }}
                        formatter={(value: number) => [value.toFixed(4), 'SHAP Value']}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                        {sortedData.map((entry, index) => (
                            <Cell
                                key={`${chartId}-cell-${index}`}
                                fill={entry.weight > 0 ? danger : success}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
