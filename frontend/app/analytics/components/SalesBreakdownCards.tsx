'use client';

import React from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Package } from 'lucide-react';

interface SalesBreakdown {
    normal: { revenue: number; count: number; percentage: number };
    'cross-sell': { revenue: number; count: number; percentage: number };
    upsell: { revenue: number; count: number; percentage: number };
}

interface SalesBreakdownCardsProps {
    totalRevenue: number;
    breakdown: SalesBreakdown;
    isLoading?: boolean;
}

export default function SalesBreakdownCards({
    totalRevenue,
    breakdown,
    isLoading = false,
}: SalesBreakdownCardsProps) {
    const cards = [
        {
            title: 'Normal Sales',
            icon: ShoppingCart,
            data: breakdown.normal,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            title: 'Cross-sell',
            icon: Package,
            data: breakdown['cross-sell'],
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
        },
        {
            title: 'Upsell',
            icon: TrendingUp,
            data: breakdown.upsell,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            title: 'Total Revenue',
            icon: DollarSign,
            data: { revenue: totalRevenue, count: 0, percentage: 100 },
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            isTotal: true,
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-slate-800 rounded w-24 mb-2" />
                        <div className="h-8 bg-slate-800 rounded w-32 mb-1" />
                        <div className="h-3 bg-slate-800 rounded w-16" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className={`bg-slate-900/50 border ${card.borderColor} rounded-lg p-4 hover:shadow-lg transition-shadow`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">{card.title}</span>
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>

                    <p className={`text-2xl font-bold ${card.color}`}>
                        {card.data.revenue.toLocaleString()} MAD
                    </p>

                    {!card.isTotal && (
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">
                                {card.data.count} items
                            </span>
                            <span className={`text-sm font-medium ${card.color}`}>
                                {card.data.percentage}%
                            </span>
                        </div>
                    )}

                    {/* Progress bar */}
                    {!card.isTotal && (
                        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${card.bgColor.replace('/10', '')} rounded-full transition-all`}
                                style={{ width: `${card.data.percentage}%` }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
