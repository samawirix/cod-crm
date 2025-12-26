'use client';

import {
    Phone, PhoneCall, CheckCircle, Clock, TrendingUp, DollarSign,
    Volume2, VolumeX, RefreshCw
} from 'lucide-react';

interface GlobalKpiHeaderProps {
    statsData: {
        total_calls: number;
        answered: number;
        confirmed: number;
        callbacks_needed: number;
        contact_rate: number;
        live_profit?: number;
    } | null;
    user?: { name: string; initials?: string } | null;
    soundEnabled: boolean;
    onSoundToggle: () => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
}

export default function GlobalKpiHeader({
    statsData,
    user,
    soundEnabled,
    onSoundToggle,
    onRefresh,
    isRefreshing = false
}: GlobalKpiHeaderProps) {
    const conversionRate = statsData?.total_calls && statsData.total_calls > 0
        ? Math.round((statsData.confirmed / statsData.total_calls) * 100)
        : 0;

    return (
        <div className="bg-background border-b border-border">
            {/* Single Row Header - Compact Design */}
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left: Title */}
                <div>
                    <h1 className="text-lg font-bold text-foreground">Call Center</h1>
                    <p className="text-xs text-muted-foreground">Manage calls and follow-ups</p>
                </div>

                {/* Center: Compact Stats Pills */}
                <div className="flex items-center gap-2">
                    {/* Total Calls */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Phone size={14} className="text-blue-400" />
                        <span className="text-sm font-bold text-blue-400">{statsData?.total_calls || 0}</span>
                        <span className="text-xs text-muted-foreground">Calls</span>
                    </div>

                    {/* Answered */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <PhoneCall size={14} className="text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">{statsData?.answered || 0}</span>
                        <span className="text-xs text-muted-foreground">Answered</span>
                    </div>

                    {/* Confirmed */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                        <CheckCircle size={14} className="text-teal-400" />
                        <span className="text-sm font-bold text-teal-400">
                            {statsData?.confirmed || 0}<span className="text-xs text-muted-foreground">/60</span>
                        </span>
                        <span className="text-xs text-muted-foreground">Confirmed</span>
                    </div>

                    {/* Callbacks */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-sm font-bold text-amber-400">{statsData?.callbacks_needed || 0}</span>
                        <span className="text-xs text-muted-foreground">Callbacks</span>
                    </div>

                    {/* Conversion */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                        <TrendingUp size={14} className="text-violet-400" />
                        <span className="text-sm font-bold text-violet-400">{conversionRate}%</span>
                        <span className="text-xs text-muted-foreground">Rate</span>
                    </div>

                    {/* Live Profit */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <DollarSign size={14} className="text-green-400" />
                        <span className="text-sm font-bold text-green-400">
                            {(statsData?.live_profit || 4890).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">MAD</span>
                    </div>
                </div>

                {/* Right: Controls & Agent */}
                <div className="flex items-center gap-2">
                    {/* Sound Toggle */}
                    <button
                        onClick={onSoundToggle}
                        className={`p-2 rounded-lg transition-colors ${soundEnabled
                                ? 'bg-emerald-600 text-white'
                                : 'bg-secondary text-muted-foreground hover:bg-muted'
                            }`}
                        title={soundEnabled ? 'Sound On' : 'Sound Off'}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-2 bg-secondary hover:bg-muted rounded-lg text-muted-foreground transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>

                    {/* Agent Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg border border-border ml-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                            {user?.initials || 'AU'}
                        </div>
                        <span className="text-sm font-medium text-foreground">{user?.name || 'Agent'}</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
