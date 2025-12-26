'use client';

import { Phone, Calendar, Clock } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Lead {
    id: number;
    name: string;
    phone: string;
    city?: string;
    product_interest?: string;
    source?: string;
    status: string;
    call_count: number;
    trust?: string;
    trust_label?: string;
    callback_time?: string;
    callback_notes?: string;
}

interface LeadQueueProps {
    focusLeads: Lead[];
    callbackLeads: Lead[];
    activeTab: 'focus' | 'history' | 'callbacks';
    onTabChange: (tab: 'focus' | 'history' | 'callbacks') => void;
    activeLead: Lead | null;
    onStartCall: (lead: Lead) => void;
    onReschedule: (lead: Lead) => void;
    callbacksCount: number;
    focusCount: number;
    isExpanded: boolean;
}

// ═══════════════════════════════════════════════════════════════
// LEAD QUEUE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function LeadQueue({
    focusLeads,
    callbackLeads,
    activeTab,
    onTabChange,
    activeLead,
    onStartCall,
    onReschedule,
    callbacksCount,
    focusCount,
    isExpanded,
}: LeadQueueProps) {

    // Calculate waiting count
    const waitingCount = focusLeads.filter(l => l.status === 'new').length || focusLeads.length;

    return (
        <div
            className={`border-r border-dark-600 flex flex-col bg-dark-900 transition-all duration-300 ${isExpanded ? 'w-full' : 'w-[35%]'
                }`}
        >
            {/* Tabs */}
            <div className="flex items-center gap-2 p-3 border-b border-dark-600">
                {/* Focus Tab */}
                <button
                    onClick={() => onTabChange('focus')}
                    className={`px-4 py-2 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === 'focus'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-dark-700 text-light-200 hover:bg-dark-600'
                        }`}
                >
                    Focus Mode
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[11px]">
                        {focusCount}
                    </span>
                </button>

                {/* History Tab */}
                <button
                    onClick={() => onTabChange('history')}
                    className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${activeTab === 'history'
                            ? 'bg-dark-600 text-white'
                            : 'bg-dark-700 text-light-200 hover:bg-dark-600'
                        }`}
                >
                    Call History
                </button>

                {/* Callbacks Tab */}
                <button
                    onClick={() => onTabChange('callbacks')}
                    className={`px-4 py-2 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === 'callbacks'
                            ? 'bg-amber-600 text-white'
                            : 'bg-dark-700 text-light-200 hover:bg-dark-600'
                        }`}
                >
                    Callbacks
                    {callbacksCount > 0 && (
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[11px]">
                            {callbacksCount}
                        </span>
                    )}
                </button>

                {/* Waiting Badge */}
                <span className="ml-auto px-3 py-1 bg-emerald-600 rounded-full text-xs font-semibold text-white">
                    {waitingCount} Waiting
                </span>
            </div>

            {/* Lead List */}
            <div className="flex-1 overflow-y-auto p-2">
                {/* Focus Tab Content */}
                {activeTab === 'focus' && (
                    <>
                        {focusLeads.map((lead) => (
                            <FocusLeadCard
                                key={lead.id}
                                lead={lead}
                                isActive={activeLead?.id === lead.id}
                                isDisabled={!!activeLead && activeLead.id !== lead.id}
                                onStartCall={onStartCall}
                            />
                        ))}
                        {focusLeads.length === 0 && (
                            <EmptyState icon={<Phone size={48} />} message="No leads in queue" />
                        )}
                    </>
                )}

                {/* Callbacks Tab Content */}
                {activeTab === 'callbacks' && (
                    <>
                        {callbackLeads.map((lead) => (
                            <CallbackLeadCard
                                key={lead.id}
                                lead={lead}
                                isDisabled={!!activeLead}
                                onStartCall={onStartCall}
                                onReschedule={onReschedule}
                            />
                        ))}
                        {callbackLeads.length === 0 && (
                            <EmptyState icon={<Calendar size={48} />} message="No scheduled callbacks" />
                        )}
                    </>
                )}

                {/* History Tab Content (placeholder) */}
                {activeTab === 'history' && (
                    <EmptyState icon={<Clock size={48} />} message="Call history coming soon" />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FOCUS LEAD CARD
// ═══════════════════════════════════════════════════════════════
function FocusLeadCard({
    lead,
    isActive,
    isDisabled,
    onStartCall,
}: {
    lead: Lead;
    isActive: boolean;
    isDisabled: boolean;
    onStartCall: (lead: Lead) => void;
}) {
    const getTrustStyles = () => {
        if (lead.trust === 'vip') return 'bg-emerald-500/15 text-emerald-400';
        if (lead.trust === 'high_risk') return 'bg-red-500/15 text-red-400';
        return 'bg-blue-500/15 text-blue-400';
    };

    return (
        <div
            onClick={() => !isDisabled && onStartCall(lead)}
            className={`p-3 rounded-lg mb-2 transition-all cursor-pointer ${isActive
                    ? 'bg-blue-500/10 border border-blue-500'
                    : 'bg-dark-800 border border-dark-600 hover:bg-dark-700'
                } ${isDisabled ? 'opacity-50 cursor-default' : ''}`}
        >
            {/* Header Row */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-light-100">{lead.name}</p>
                    <p className="text-xs text-blue-400">{lead.phone}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTrustStyles()}`}>
                    {lead.trust_label || 'New'}
                </span>
            </div>

            {/* Info Row */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-light-200">
                {lead.product_interest && (
                    <span className="text-purple-400">📦 {lead.product_interest}</span>
                )}
                {lead.city && <span>📍 {lead.city}</span>}
                <span>📞 {lead.call_count} calls</span>
            </div>

            {/* Call Button */}
            {!isDisabled && (
                <button
                    onClick={(e) => { e.stopPropagation(); onStartCall(lead); }}
                    className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                    <Phone size={14} /> Call
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CALLBACK LEAD CARD
// ═══════════════════════════════════════════════════════════════
function CallbackLeadCard({
    lead,
    isDisabled,
    onStartCall,
    onReschedule,
}: {
    lead: Lead;
    isDisabled: boolean;
    onStartCall: (lead: Lead) => void;
    onReschedule: (lead: Lead) => void;
}) {
    const callbackTime = lead.callback_time ? new Date(lead.callback_time) : null;
    const now = new Date();
    const isPastDue = callbackTime && callbackTime < now;
    const isUpcoming = callbackTime && callbackTime > now &&
        (callbackTime.getTime() - now.getTime()) < 30 * 60 * 1000;
    const minutesOverdue = callbackTime && isPastDue
        ? Math.round((now.getTime() - callbackTime.getTime()) / 60000)
        : 0;

    const getCardStyles = () => {
        if (isPastDue) return 'bg-red-500/5 border-red-500 animate-pulse';
        if (isUpcoming) return 'bg-amber-500/5 border-amber-500';
        return 'bg-dark-800 border-dark-600';
    };

    const getStatusDotColor = () => {
        if (isPastDue) return 'bg-red-500';
        if (isUpcoming) return 'bg-amber-500';
        return 'bg-light-200';
    };

    const getTimeColor = () => {
        if (isPastDue) return 'text-red-400';
        if (isUpcoming) return 'text-amber-400';
        return 'text-light-200';
    };

    return (
        <div className={`p-3 rounded-lg mb-2 border ${getCardStyles()}`}>
            {/* Header */}
            <div className="flex items-start gap-2">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${getStatusDotColor()}`} />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-light-100">{lead.name}</p>
                    <p className="text-xs text-blue-400">{lead.phone}</p>

                    {/* Callback Time */}
                    {callbackTime ? (
                        <div className={`flex items-center gap-2 mt-1 text-xs ${getTimeColor()}`}>
                            <Clock size={12} />
                            <span>
                                {isPastDue && '⚠️ OVERDUE: '}
                                {callbackTime.toLocaleString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            {isPastDue && minutesOverdue > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-[10px]">
                                    {minutesOverdue} min ago
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <Calendar size={12} /> Not scheduled
                        </p>
                    )}

                    {/* Notes */}
                    {lead.callback_notes && (
                        <p className="text-[11px] text-light-200 mt-1">
                            📝 {lead.callback_notes}
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => onReschedule(lead)}
                    className="px-3 py-1.5 bg-dark-700 border border-dark-600 rounded-md text-light-100 text-[11px] flex items-center gap-1 hover:bg-dark-600 transition-colors cursor-pointer"
                >
                    <Calendar size={12} /> Reschedule
                </button>
                <button
                    onClick={() => onStartCall(lead)}
                    disabled={isDisabled}
                    className={`flex-1 py-1.5 rounded-md text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${isPastDue
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <Phone size={14} />
                    {isPastDue ? 'Call NOW!' : 'Call Back'}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-light-200">
            <div className="opacity-50 mb-3">{icon}</div>
            <p className="text-sm">{message}</p>
        </div>
    );
}
