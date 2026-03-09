import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FeatureContribution } from '../../types';

interface FeatureImportanceChartProps {
    data: FeatureContribution[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis
                        type="number"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickFormatter={(value) => value.toFixed(2)}
                    />
                    <YAxis
                        dataKey="feature"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={12}
                        width={100}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: number) => [value.toFixed(4), 'SHAP Value']}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                        {sortedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.weight > 0 ? '#ef4444' : '#22c55e'}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
