'use client';

import React from 'react';
import { Phone, PhoneOff, MessageCircle } from 'lucide-react';

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
    notes?: string | { content?: string };
}

interface ActiveCallPanelProps {
    lead: Lead;
    callDuration: number;
    callNotes: string;
    onNotesChange: (notes: string) => void;
    onEndCall: () => void;
    children: React.ReactNode; // Order Builder content
}

// ═══════════════════════════════════════════════════════════════
// FORMAT DURATION HELPER
// ═══════════════════════════════════════════════════════════════
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE CALL PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ActiveCallPanel({
    lead,
    callDuration,
    callNotes,
    onNotesChange,
    onEndCall,
    children,
}: ActiveCallPanelProps) {
    // WhatsApp quick messages
    const whatsappMessages = [
        {
            label: '📞 No Answer',
            msg: `Salam ${lead.name.split(' ')[0]}, 3ayetna lik 3la 9bel l'commande...`
        },
        {
            label: '📍 Location',
            msg: `Salam, momkin location dyalek bach livreur yjib lik talab?`
        },
        {
            label: '✅ Confirm',
            msg: `Bghit n'akid m3ak talab ${lead.product_interest || ''}...`
        },
    ];

    // Format phone for WhatsApp
    const phoneNumber = lead.phone.replace(/[^0-9]/g, '');

    // Get lead notes as string
    const getLeadNotes = (): string => {
        if (!lead.notes) return '';
        if (typeof lead.notes === 'string') return lead.notes;
        return lead.notes.content || JSON.stringify(lead.notes);
    };

    return (
        <div className="flex-1 flex flex-col bg-dark-900">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CALL HEADER */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 bg-dark-800 border-b border-dark-600 flex justify-between items-center">
                {/* Customer Info */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                        <Phone size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-light-100">{lead.name}</p>
                        <div className="flex items-center gap-3 text-[13px]">
                            <span className="text-blue-400">{lead.phone}</span>
                            <span className="text-light-200">Source: {lead.source || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                {/* Timer & End Call */}
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-[28px] font-bold text-emerald-500 font-mono">
                            {formatDuration(callDuration)}
                        </p>
                        <p className="text-[10px] text-light-200">Duration</p>
                    </div>
                    <button
                        onClick={onEndCall}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <PhoneOff size={18} /> End
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* WHATSAPP QUICK ACTIONS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 py-2 bg-dark-700 flex items-center gap-2 border-b border-dark-600">
                <span className="text-xs text-light-200 flex items-center gap-1">
                    <MessageCircle size={14} className="text-[#25D366]" /> WhatsApp:
                </span>
                {whatsappMessages.map((wa, idx) => (
                    <a
                        key={idx}
                        href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(wa.msg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20BD5C] rounded text-white text-[11px] no-underline transition-colors"
                    >
                        {wa.label}
                    </a>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT - TWO COLUMNS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Notes & Lead Info (35%) */}
                <div className="w-[35%] p-3 border-r border-dark-600 overflow-y-auto">
                    {/* Call Notes */}
                    <h4 className="text-xs font-semibold text-light-200 mb-2">
                        📝 CALL NOTES
                    </h4>
                    <textarea
                        value={callNotes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Quick notes..."
                        className="w-full h-20 p-2 bg-dark-800 border border-dark-600 rounded-md text-light-100 text-xs resize-none focus:border-emerald-500 focus:outline-none placeholder:text-light-200/50"
                    />

                    {/* Lead Info */}
                    <div className="mt-3">
                        <h4 className="text-xs font-semibold text-light-200 mb-2">
                            👤 LEAD INFO
                        </h4>
                        <div className="text-xs text-light-100 space-y-1">
                            <p>📍 {lead.city || 'No city'}</p>
                            <p>📦 Interest: {lead.product_interest || 'None'}</p>
                            <p>📞 Calls: {lead.call_count}</p>
                            {getLeadNotes() && <p>📝 {getLeadNotes()}</p>}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Order Builder (65%) - Passed as children */}
                <div className="flex-1 p-3 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
