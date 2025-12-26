'use client';

import {
    Phone, PhoneCall, CheckCircle, Clock, TrendingUp, DollarSign,
    Target, Volume2, VolumeX, RefreshCw
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
        <div className="border-b border-dark-600 bg-dark-900">
            {/* Top Row: Title + Agent Badge */}
            <div className="flex items-center justify-between p-4 pb-3">
                <div>
                    <h1 className="text-[22px] font-bold text-light-100">Call Center</h1>
                    <p className="text-xs text-light-200 mt-1">Manage calls and follow-ups</p>
                </div>

                {/* Agent Badge */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-700 rounded-xl border border-dark-600">
                    <span className="text-[11px] text-light-200 uppercase tracking-wide">Agent:</span>
                    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                        {user?.initials || 'AU'}
                    </div>
                    <span className="text-sm font-semibold text-light-100">{user?.name || 'Admin User'}</span>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-4 pb-4">
                {/* Total Calls Card */}
                <div className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/30 rounded-xl p-4 hover:scale-[1.02] transition-transform relative overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-2.5">
                        <Phone size={20} className="text-white" />
                    </div>
                    <p className="text-[28px] font-bold text-blue-400">
                        {statsData?.total_calls || 0}
                    </p>
                    <p className="text-xs text-light-200 mt-1">Total Calls</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-emerald-500">
                        <TrendingUp size={12} />
                        <span>+12% today</span>
                    </div>
                </div>

                {/* Answered Card */}
                <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 hover:scale-[1.02] transition-transform">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2.5">
                        <PhoneCall size={20} className="text-white" />
                    </div>
                    <p className="text-[28px] font-bold text-emerald-400">
                        {statsData?.answered || 0}
                    </p>
                    <p className="text-xs text-light-200 mt-1">Answered</p>
                    <div className="mt-2 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${statsData?.contact_rate || 0}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-emerald-400 mt-1">{statsData?.contact_rate || 0}% contact rate</p>
                </div>

                {/* Confirmed Today Card */}
                <div className="bg-gradient-to-br from-teal-500/15 to-teal-500/5 border border-teal-500/30 rounded-xl p-4 hover:scale-[1.02] transition-transform">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30 mb-2.5">
                        <CheckCircle size={20} className="text-white" />
                    </div>
                    <p className="text-[28px] font-bold text-teal-400">
                        {statsData?.confirmed || 0}
                        <span className="text-base text-light-200">/60</span>
                    </p>
                    <p className="text-xs text-light-200 mt-1">Confirmed Today</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-teal-400">
                        <Target size={12} />
                        <span>Daily Goal</span>
                    </div>
                </div>

                {/* Callbacks Card */}
                <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-xl p-4 hover:scale-[1.02] transition-transform">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-2.5">
                        <Clock size={20} className="text-white" />
                    </div>
                    <p className="text-[28px] font-bold text-amber-400">
                        {statsData?.callbacks_needed || 0}
                    </p>
                    <p className="text-xs text-light-200 mt-1">Callbacks</p>
                    {(statsData?.callbacks_needed || 0) > 0 && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-400 font-semibold">
                            Pending
                        </span>
                    )}
                </div>

                {/* Conversion Card */}
                <div className="bg-gradient-to-br from-violet-500/15 to-violet-500/5 border border-violet-500/30 rounded-xl p-4 hover:scale-[1.02] transition-transform">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-2.5">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <p className="text-[28px] font-bold text-violet-400">
                        {conversionRate}%
                    </p>
                    <p className="text-xs text-light-200 mt-1">Conversion</p>
                    <div className="flex items-end gap-0.5 mt-2 h-5">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div
                                key={i}
                                className={`w-1.5 rounded-sm transition-all ${i === 6 ? 'bg-violet-500' : 'bg-violet-500/30'}`}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Live Profit Card */}
                <div className="bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/30 rounded-xl p-4 hover:scale-[1.02] transition-transform">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-2.5">
                        <DollarSign size={20} className="text-white" />
                    </div>
                    <p className="text-[28px] font-bold text-green-400">
                        {(statsData?.live_profit || 4890).toLocaleString()}
                    </p>
                    <p className="text-xs text-light-200 mt-1">Live Profit</p>
                    <span className="text-[11px] text-green-400">MAD Today</span>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex justify-end gap-2 px-4 pb-4">
                <button
                    onClick={onSoundToggle}
                    className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 text-[13px] font-medium text-white cursor-pointer transition-colors ${soundEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-dark-700 hover:bg-dark-600'
                        }`}
                >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    Sound {soundEnabled ? 'On' : 'Off'}
                </button>
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="px-3.5 py-2 bg-dark-700 border border-dark-600 rounded-lg text-light-100 text-[13px] flex items-center gap-1.5 cursor-pointer hover:bg-dark-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>
        </div>
    );
}
