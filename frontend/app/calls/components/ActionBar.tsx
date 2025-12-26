'use client';

import React, { useState } from 'react';
import { CheckCircle, Calendar, PhoneMissed, XCircle, Ban, PhoneOff, ArrowLeft } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// CANCEL REASONS
// ═══════════════════════════════════════════════════════════════
const CANCEL_REASONS = [
    { label: '💸 Price Too High', reason: 'PRICE', color: 'bg-red-700' },
    { label: '📦 Out of Stock', reason: 'OOS', color: 'bg-dark-500' },
    { label: '🤔 Changed Mind', reason: 'CHANGED_MIND', color: 'bg-dark-500' },
    { label: '🏠 Delivery Issue', reason: 'DELIVERY', color: 'bg-dark-500' },
    { label: '❓ Other', reason: 'OTHER', color: 'bg-dark-500' },
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface ActionBarProps {
    onConfirm: () => void;
    onCallback: () => void;
    onNoAnswer: () => void;
    onCancel: (reason: string) => void;
    onWrongNumber: () => void;
    onSkip: () => void;
    confirmDisabled: boolean;
    isProcessing?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ACTION BAR COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ActionBar({
    onConfirm,
    onCallback,
    onNoAnswer,
    onCancel,
    onWrongNumber,
    onSkip,
    confirmDisabled,
    isProcessing = false,
}: ActionBarProps) {
    const [showCancelReasons, setShowCancelReasons] = useState(false);

    // Button base styles
    const buttonBase = "py-3 px-2 rounded-lg text-[11px] font-semibold cursor-pointer flex flex-col items-center gap-1 transition-all";
    const iconSize = 20;

    return (
        <div className="p-3 border-t border-dark-600 bg-dark-800">
            {!showCancelReasons ? (
                <div className="grid grid-cols-6 gap-2">
                    {/* ✅ Confirmed */}
                    <button
                        onClick={onConfirm}
                        disabled={confirmDisabled || isProcessing}
                        className={`${buttonBase} ${confirmDisabled || isProcessing
                            ? 'bg-emerald-600/30 text-emerald-200/50 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-600/30'
                            }`}
                    >
                        <CheckCircle size={iconSize} />
                        <span>Confirmed</span>
                        <span className="text-[10px] text-emerald-200/70">[C]</span>
                    </button>

                    {/* 📅 Callback */}
                    <button
                        onClick={onCallback}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50`}
                    >
                        <Calendar size={iconSize} />
                        <span>Callback</span>
                        <span className="text-[10px] text-amber-200/70">[B]</span>
                    </button>

                    {/* 📞 No Answer */}
                    <button
                        onClick={onNoAnswer}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50`}
                    >
                        <PhoneMissed size={iconSize} />
                        <span>No Answer</span>
                        <span className="text-[10px] text-teal-200/70">[N]</span>
                    </button>

                    {/* ❌ Cancel (Opens reasons) */}
                    <button
                        onClick={() => setShowCancelReasons(true)}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-red-600 hover:bg-red-700 text-white disabled:opacity-50`}
                    >
                        <XCircle size={iconSize} />
                        <span>Cancel</span>
                        <span className="text-[10px] text-red-200/70">▼</span>
                    </button>

                    {/* 🚫 Wrong Number */}
                    <button
                        onClick={onWrongNumber}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] disabled:opacity-50`}
                    >
                        <Ban size={iconSize} />
                        <span>Wrong #</span>
                    </button>

                    {/* Skip/End Call */}
                    <button
                        onClick={onSkip}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] disabled:opacity-50`}
                    >
                        <PhoneOff size={iconSize} />
                        <span>Skip</span>
                        <span className="text-[10px] text-[#8b949e]">[Esc]</span>
                    </button>
                </div>
            ) : (
                /* Cancel Reasons Panel */
                <div>
                    <div className="flex justify-between items-center mb-2.5">
                        <span className="text-xs text-light-200">Select cancellation reason:</span>
                        <button
                            onClick={() => setShowCancelReasons(false)}
                            className="bg-transparent border-none text-light-200 hover:text-light-100 cursor-pointer flex items-center gap-1 text-xs"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {CANCEL_REASONS.map(opt => (
                            <button
                                key={opt.reason}
                                onClick={() => {
                                    onCancel(opt.reason);
                                    setShowCancelReasons(false);
                                }}
                                disabled={isProcessing}
                                className={`py-2.5 px-2 rounded-md text-white text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-50 ${opt.reason === 'PRICE'
                                    ? 'bg-red-700 hover:bg-red-800'
                                    : 'bg-dark-500 hover:bg-dark-400'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
