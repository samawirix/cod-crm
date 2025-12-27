'use client';

import React from 'react';
import { Trophy, Medal } from 'lucide-react';

interface Agent {
    agent_id: number;
    agent_name: string;
    total_orders: number;
    total_revenue: number;
    cross_sell_revenue: number;
    upsell_revenue: number;
    cross_sell_count: number;
    cross_sell_rate: number;
}

interface AgentLeaderboardProps {
    agents: Agent[];
    isLoading?: boolean;
}

export default function AgentLeaderboard({ agents, isLoading = false }: AgentLeaderboardProps) {
    if (isLoading) {
        return (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                <div className="h-4 bg-slate-800 rounded w-48 mb-4" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                        <div className="w-8 h-8 bg-slate-800 rounded-full" />
                        <div className="flex-1">
                            <div className="h-4 bg-slate-800 rounded w-32 mb-1" />
                            <div className="h-3 bg-slate-800 rounded w-24" />
                        </div>
                        <div className="h-6 bg-slate-800 rounded w-20" />
                    </div>
                ))}
            </div>
        );
    }

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-500';
        if (index === 1) return 'text-gray-400';
        if (index === 2) return 'text-amber-600';
        return 'text-slate-500';
    };

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-white">
                    Top Agents (Cross-sell)
                </h3>
            </div>

            <div className="space-y-1">
                {agents.map((agent, index) => (
                    <div
                        key={agent.agent_id}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${index < 3 ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'
                            }`}
                    >
                        {/* Rank */}
                        <div className={`w-8 text-center font-bold ${getMedalColor(index)}`}>
                            {index < 3 ? (
                                <Medal className={`w-6 h-6 mx-auto ${getMedalColor(index)}`} />
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{agent.agent_name}</p>
                            <p className="text-xs text-slate-500">
                                {agent.total_orders} orders • {agent.cross_sell_count} cross-sells
                            </p>
                        </div>

                        {/* Cross-sell Rate */}
                        <div className="text-right">
                            <p className="font-semibold text-amber-500">
                                {agent.cross_sell_rate}%
                            </p>
                            <p className="text-xs text-slate-500">
                                {agent.cross_sell_revenue.toLocaleString()} MAD
                            </p>
                        </div>
                    </div>
                ))}

                {agents.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                        No agent data available
                    </p>
                )}
            </div>
        </div>
    );
}
