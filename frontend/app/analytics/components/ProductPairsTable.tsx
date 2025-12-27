'use client';

import React from 'react';
import { Link2, ArrowRight } from 'lucide-react';

interface ProductPair {
    main_product: string;
    cross_sell_product: string;
    count: number;
}

interface ProductPairsTableProps {
    pairs: ProductPair[];
    isLoading?: boolean;
}

export default function ProductPairsTable({ pairs, isLoading = false }: ProductPairsTableProps) {
    if (isLoading) {
        return (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                <div className="h-4 bg-slate-800 rounded w-48 mb-4" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                        <div className="h-4 bg-slate-800 rounded w-32" />
                        <div className="h-4 bg-slate-800 rounded w-4" />
                        <div className="h-4 bg-slate-800 rounded w-32" />
                        <div className="h-4 bg-slate-800 rounded w-16 ml-auto" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-white">
                    Best Product Pairs
                </h3>
            </div>

            <div className="space-y-2">
                {pairs.map((pair, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-slate-800/20 rounded-lg hover:bg-slate-800/30 transition-colors"
                    >
                        {/* Main Product */}
                        <span className="flex-1 text-sm text-white truncate">
                            {pair.main_product}
                        </span>

                        {/* Arrow */}
                        <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" />

                        {/* Cross-sell Product */}
                        <span className="flex-1 text-sm text-amber-500 truncate">
                            {pair.cross_sell_product}
                        </span>

                        {/* Count */}
                        <span className="text-sm font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            {pair.count}×
                        </span>
                    </div>
                ))}

                {pairs.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                        No product pairs data yet
                    </p>
                )}
            </div>
        </div>
    );
}
