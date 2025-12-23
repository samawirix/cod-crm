import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    // Lead statuses
    new: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    contacted: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    qualified: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    confirmed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    won: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    lost: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },

    // Order statuses
    pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    processing: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    shipped: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    out_for_delivery: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    delivered: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    returned: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    cancelled: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },

    // Payment statuses
    paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    collected: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    refunded: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },

    // User statuses
    active: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    inactive: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },

    // Roles
    admin: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    manager: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    agent: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    fulfillment: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },

    // Call outcomes
    answered: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    no_answer: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    busy: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    callback: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    wrong_number: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    interested: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    not_interested: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },

    // Couriers
    amana: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    yalidine: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    cathedis: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    ctm: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    chrono_diali: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    aramex: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    dhl: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    other: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },

    // Default
    default: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalizedStatus = status?.toLowerCase().replace(/[^a-z]/g, '_') || 'default';
    const config = statusConfig[normalizedStatus] || statusConfig.default;

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
                config.bg,
                config.text,
                config.border,
                className
            )}
        >
            {status?.toUpperCase() || 'UNKNOWN'}
        </span>
    );
}
