'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface TrendData {
    date: string;
    normal: number;
    'cross-sell': number;
    upsell: number;
    total: number;
}

interface SalesTrendChartProps {
    data: TrendData[];
    isLoading?: boolean;
}

export default function SalesTrendChart({ data, isLoading = false }: SalesTrendChartProps) {
    if (isLoading) {
        return (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                <div className="h-4 bg-slate-800 rounded w-48 mb-4" />
                <div className="h-64 bg-slate-800 rounded animate-pulse" />
            </div>
        );
    }

    // Format date for display
    const formattedData = data.map((d) => ({
        ...d,
        dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
                📈 Revenue Trend by Sale Type
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCrossSell" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUpsell" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="dateLabel" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#f3f4f6' }}
                        formatter={(value: number) => [`${value.toLocaleString()} MAD`, '']}
                    />

                    <Legend />

                    <Area
                        type="monotone"
                        dataKey="normal"
                        name="Normal"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorNormal)"
                        stackId="1"
                    />
                    <Area
                        type="monotone"
                        dataKey="cross-sell"
                        name="Cross-sell"
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#colorCrossSell)"
                        stackId="1"
                    />
                    <Area
                        type="monotone"
                        dataKey="upsell"
                        name="Upsell"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorUpsell)"
                        stackId="1"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
