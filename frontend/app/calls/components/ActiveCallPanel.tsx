'use client';

import React from 'react';
import { Phone, PhoneOff, MessageCircle } from 'lucide-react';

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
    children: React.ReactNode; // OrderBuilder + ActionBar
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ActiveCallPanel({
    lead,
    callDuration,
    callNotes,
    onNotesChange,
    onEndCall,
    children,
}: ActiveCallPanelProps) {
    const whatsappMessages = [
        { label: 'No Answer', msg: `Salam ${lead.name.split(' ')[0]}, 3ayetna lik 3la 9bel l'commande...` },
        { label: 'Location', msg: `Salam, momkin location dyalek bach livreur yjib lik talab?` },
        { label: 'Confirm', msg: `Bghit n'akid m3ak talab ${lead.product_interest || ''}...` },
    ];

    const phoneNumber = lead.phone.replace(/[^0-9]/g, '');

    const getLeadNotes = (): string => {
        if (!lead.notes) return '';
        if (typeof lead.notes === 'string') return lead.notes;
        return lead.notes.content || JSON.stringify(lead.notes);
    };

    // Separate children: OrderBuilder and ActionBar
    const childArray = React.Children.toArray(children);
    const orderBuilder = childArray[0];
    const actionBar = childArray[1];

    return (
        <div className="flex-1 flex flex-col bg-background min-w-0">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CALL HEADER - Compact                                           */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between gap-4">
                {/* Customer Info */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Phone size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground truncate">{lead.name}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-blue-400">{lead.phone}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground truncate">{lead.source || 'Direct'}</span>
                        </div>
                    </div>
                </div>

                {/* Timer & End Call */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-500 font-mono leading-none">
                            {formatDuration(callDuration)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Duration</p>
                    </div>
                    <button
                        onClick={onEndCall}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                        <PhoneOff size={16} />
                        <span className="hidden sm:inline">End</span>
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* WHATSAPP QUICK ACTIONS - Compact                                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="px-4 py-1.5 bg-secondary/50 flex items-center gap-2 border-b border-border">
                <MessageCircle size={14} className="text-[#25D366] flex-shrink-0" />
                <span className="text-xs text-muted-foreground mr-1">WhatsApp:</span>
                <div className="flex gap-1.5 overflow-x-auto">
                    {whatsappMessages.map((wa, idx) => (
                        <a
                            key={idx}
                            href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(wa.msg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-[#25D366] hover:bg-[#20BD5C] rounded text-white text-[11px] font-medium whitespace-nowrap transition-colors"
                        >
                            {wa.label}
                        </a>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT - Scrollable                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* LEFT: Notes & Lead Info */}
                <div className="w-[280px] flex-shrink-0 p-3 border-r border-border overflow-y-auto bg-card/50">
                    {/* Call Notes */}
                    <div className="mb-4">
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Call Notes
                        </h4>
                        <textarea
                            value={callNotes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Quick notes..."
                            className="w-full h-24 p-2.5 bg-background border border-border rounded-lg text-foreground text-sm resize-none focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Lead Info */}
                    <div>
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Lead Info
                        </h4>
                        <div className="space-y-2">
                            <InfoRow icon="📍" label="City" value={lead.city || 'Not specified'} />
                            <InfoRow icon="📦" label="Interest" value={lead.product_interest || 'None'} />
                            <InfoRow icon="📞" label="Call Count" value={String(lead.call_count)} />
                            {getLeadNotes() && (
                                <div className="p-2 bg-background rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground">📝 {getLeadNotes()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Order Builder */}
                <div className="flex-1 p-3 overflow-y-auto min-w-0">
                    {orderBuilder}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ACTION BAR - Fixed at bottom                                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {actionBar}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENT
// ═══════════════════════════════════════════════════════════════
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-base">{icon}</span>
            <span className="text-muted-foreground">{label}:</span>
            <span className="text-foreground font-medium truncate">{value}</span>
        </div>
    );
}
