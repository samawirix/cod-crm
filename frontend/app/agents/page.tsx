'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Users, Trophy, Phone, CheckCircle, TrendingUp, TrendingDown,
    Clock, Target, Award, Star, ChevronDown, BarChart3,
    RefreshCw, Calendar, Zap, PhoneCall, XCircle, PhoneOff
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const cardStyle: React.CSSProperties = {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
};

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface Agent {
    user_id: number;
    name: string;
    email: string;
    role: string;
    rank: number;
    total_calls: number;
    confirmed: number;
    interested: number;
    callbacks: number;
    no_answer: number;
    not_interested: number;
    answered_calls: number;
    confirmation_rate: number;
    contact_rate: number;
    avg_duration: number;
    total_talk_time: number;
    trend: number;
}

interface TeamStats {
    total_agents: number;
    total_calls: number;
    total_confirmed: number;
    total_answered: number;
    team_confirmation_rate: number;
    team_contact_rate: number;
}

interface Goals {
    daily: {
        call_goal: number;
        call_actual: number;
        call_progress: number;
        confirmation_goal: number;
        confirmation_actual: number;
        confirmation_progress: number;
    };
    weekly: {
        call_goal: number;
        call_actual: number;
        call_progress: number;
        confirmation_goal: number;
        confirmation_actual: number;
        confirmation_progress: number;
    };
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════
const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTalkTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' };
    if (rank === 2) return { icon: '🥈', color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.15)' };
    if (rank === 3) return { icon: '🥉', color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.15)' };
    return { icon: `#${rank}`, color: '#8b949e', bg: 'rgba(139, 148, 158, 0.1)' };
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AgentPerformancePage() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

    // Fetch leaderboard
    const { data: leaderboardData, isLoading, refetch } = useQuery<{ agents: Agent[]; team_stats: TeamStats }>({
        queryKey: ['agent-leaderboard', period],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/analytics/agent-leaderboard?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return { agents: [], team_stats: {} as TeamStats };
            return res.json();
        },
        refetchInterval: 30000,
    });

    // Fetch goals
    const { data: goalsData } = useQuery<Goals>({
        queryKey: ['team-goals'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/analytics/team-goals`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return null;
            return res.json();
        },
        refetchInterval: 30000,
    });

    const agents = leaderboardData?.agents || [];
    const teamStats = leaderboardData?.team_stats;
    const topPerformers = agents.slice(0, 5);

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trophy size={28} color="#ffd700" />
                        Agent Performance
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8b949e', marginTop: '4px' }}>Track and rank your call center team</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Period Selector */}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'all')}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#21262d',
                            border: '1px solid #30363d',
                            borderRadius: '8px',
                            color: '#e6edf3',
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={() => refetch()}
                        style={{ padding: '10px 16px', backgroundColor: '#30363d', border: 'none', borderRadius: '8px', color: '#e6edf3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Goals Progress */}
            {goalsData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#8b949e' }}>Daily Calls</span>
                            <Target size={16} color="#58a6ff" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 700, color: '#e6edf3' }}>{goalsData.daily.call_actual}</span>
                            <span style={{ fontSize: '14px', color: '#8b949e' }}>/ {goalsData.daily.call_goal}</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(goalsData.daily.call_progress, 100)}%`, height: '100%', backgroundColor: goalsData.daily.call_progress >= 100 ? '#3fb950' : '#58a6ff', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: goalsData.daily.call_progress >= 100 ? '#3fb950' : '#8b949e' }}>{goalsData.daily.call_progress}% complete</span>
                    </div>

                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#8b949e' }}>Daily Confirmed</span>
                            <CheckCircle size={16} color="#3fb950" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 700, color: '#3fb950' }}>{goalsData.daily.confirmation_actual}</span>
                            <span style={{ fontSize: '14px', color: '#8b949e' }}>/ {goalsData.daily.confirmation_goal}</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(goalsData.daily.confirmation_progress, 100)}%`, height: '100%', backgroundColor: goalsData.daily.confirmation_progress >= 100 ? '#3fb950' : '#238636', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: goalsData.daily.confirmation_progress >= 100 ? '#3fb950' : '#8b949e' }}>{goalsData.daily.confirmation_progress}% complete</span>
                    </div>

                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#8b949e' }}>Weekly Calls</span>
                            <Calendar size={16} color="#a371f7" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 700, color: '#e6edf3' }}>{goalsData.weekly.call_actual}</span>
                            <span style={{ fontSize: '14px', color: '#8b949e' }}>/ {goalsData.weekly.call_goal}</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(goalsData.weekly.call_progress, 100)}%`, height: '100%', backgroundColor: '#a371f7', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#8b949e' }}>{goalsData.weekly.call_progress}% complete</span>
                    </div>

                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#8b949e' }}>Weekly Confirmed</span>
                            <Award size={16} color="#ffd700" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 700, color: '#ffd700' }}>{goalsData.weekly.confirmation_actual}</span>
                            <span style={{ fontSize: '14px', color: '#8b949e' }}>/ {goalsData.weekly.confirmation_goal}</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(goalsData.weekly.confirmation_progress, 100)}%`, height: '100%', backgroundColor: '#ffd700', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#8b949e' }}>{goalsData.weekly.confirmation_progress}% complete</span>
                    </div>
                </div>
            )}

            {/* Top Performers Podium */}
            <div style={{ ...cardStyle, padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={20} color="#ffd700" />
                    Top Performers - {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
                </h3>

                {topPerformers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                        <Users size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>No call data for this period</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px' }}>
                        {/* Reorder to show 2nd, 1st, 3rd */}
                        {[topPerformers[1], topPerformers[0], topPerformers[2]].filter(Boolean).map((agent, idx) => {
                            if (!agent) return null;
                            const heights = [140, 180, 120];
                            const rank = agent.rank;
                            const badge = getRankBadge(rank);

                            return (
                                <div key={agent.user_id} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '120px',
                                        height: `${heights[idx]}px`,
                                        background: `linear-gradient(180deg, ${badge.bg} 0%, transparent 100%)`,
                                        borderRadius: '12px 12px 0 0',
                                        border: `2px solid ${badge.color}`,
                                        borderBottom: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        padding: '16px 12px',
                                        position: 'relative',
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-20px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            fontSize: '32px',
                                        }}>
                                            {badge.icon}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3', marginBottom: '4px' }}>{agent.name}</div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: badge.color }}>{agent.confirmed}</div>
                                        <div style={{ fontSize: '10px', color: '#8b949e' }}>confirmed</div>
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#3fb950' }}>{agent.confirmation_rate}%</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Team Stats Row */}
            {teamStats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <Users size={20} color="#58a6ff" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#e6edf3' }}>{teamStats.total_agents}</p>
                        <p style={{ fontSize: '11px', color: '#8b949e' }}>Active Agents</p>
                    </div>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <Phone size={20} color="#a371f7" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#a371f7' }}>{teamStats.total_calls}</p>
                        <p style={{ fontSize: '11px', color: '#8b949e' }}>Total Calls</p>
                    </div>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <PhoneCall size={20} color="#58a6ff" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#58a6ff' }}>{teamStats.total_answered}</p>
                        <p style={{ fontSize: '11px', color: '#8b949e' }}>Answered</p>
                    </div>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <CheckCircle size={20} color="#3fb950" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#3fb950' }}>{teamStats.total_confirmed}</p>
                        <p style={{ fontSize: '11px', color: '#8b949e' }}>Confirmed</p>
                    </div>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <TrendingUp size={20} color="#ffd700" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#ffd700' }}>{teamStats.team_confirmation_rate}%</p>
                        <p style={{ fontSize: '11px', color: '#8b949e' }}>Team Rate</p>
                    </div>
                </div>
            )}

            {/* Agent Table */}
            <div style={cardStyle}>
                <div style={{ padding: '16px', borderBottom: '1px solid #30363d' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3' }}>All Agents</h3>
                </div>
                <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0d1117' }}>
                                {['Rank', 'Agent', 'Calls', 'Answered', 'Confirmed', 'Interested', 'Callbacks', 'No Answer', 'Rate', 'Avg Time', 'Talk Time', 'Trend'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', borderBottom: '1px solid #30363d' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>Loading...</td></tr>
                            ) : agents.length === 0 ? (
                                <tr><td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>No agents found</td></tr>
                            ) : (
                                agents.map((agent) => {
                                    const badge = getRankBadge(agent.rank);
                                    return (
                                        <tr key={agent.user_id} style={{ borderBottom: '1px solid #21262d' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                    fontWeight: 700,
                                                    fontSize: agent.rank <= 3 ? '16px' : '12px',
                                                }}>
                                                    {badge.icon}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: 500, color: '#e6edf3' }}>{agent.name}</p>
                                                <p style={{ fontSize: '11px', color: '#8b949e' }}>{agent.role}</p>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#a371f7' }}>{agent.total_calls}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#58a6ff' }}>{agent.answered_calls}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#3fb950' }}>{agent.confirmed}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#d29922' }}>{agent.interested}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#58a6ff' }}>{agent.callbacks}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8b949e' }}>{agent.no_answer}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    backgroundColor: agent.confirmation_rate >= 70 ? 'rgba(63, 185, 80, 0.15)' : agent.confirmation_rate >= 50 ? 'rgba(210, 153, 34, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                                                    color: agent.confirmation_rate >= 70 ? '#3fb950' : agent.confirmation_rate >= 50 ? '#d29922' : '#f85149',
                                                }}>
                                                    {agent.confirmation_rate}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#e6edf3' }}>{formatDuration(agent.avg_duration)}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8b949e' }}>{formatTalkTime(agent.total_talk_time)}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {agent.trend > 0 ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3fb950', fontSize: '12px' }}>
                                                        <TrendingUp size={14} /> +{agent.trend}
                                                    </span>
                                                ) : agent.trend < 0 ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f85149', fontSize: '12px' }}>
                                                        <TrendingDown size={14} /> {agent.trend}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#8b949e', fontSize: '12px' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
