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
                                ? 'bg-dark-700 text-light-200 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-600/30'
                            }`}
                    >
                        <CheckCircle size={iconSize} />
                        Confirmed
                    </button>

                    {/* 📅 Callback */}
                    <button
                        onClick={onCallback}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50`}
                    >
                        <Calendar size={iconSize} />
                        Callback
                    </button>

                    {/* 📞 No Answer */}
                    <button
                        onClick={onNoAnswer}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50`}
                    >
                        <PhoneMissed size={iconSize} />
                        No Answer
                    </button>

                    {/* ❌ Cancel (Opens reasons) */}
                    <button
                        onClick={() => setShowCancelReasons(true)}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-red-700 hover:bg-red-800 text-white disabled:opacity-50`}
                    >
                        <XCircle size={iconSize} />
                        Cancel ▼
                    </button>

                    {/* 🚫 Wrong Number */}
                    <button
                        onClick={onWrongNumber}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-dark-700 hover:bg-dark-600 border border-dark-600 text-red-500 disabled:opacity-50`}
                    >
                        <Ban size={iconSize} />
                        Wrong #
                    </button>

                    {/* Skip/End Call */}
                    <button
                        onClick={onSkip}
                        disabled={isProcessing}
                        className={`${buttonBase} bg-dark-900 hover:bg-dark-700 border border-dark-600 text-light-200 disabled:opacity-50`}
                    >
                        <PhoneOff size={iconSize} />
                        Skip
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

            {/* Optional: Keyboard shortcuts hint */}
            {!showCancelReasons && (
                <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-light-200/60">
                    <span>[C] Confirm</span>
                    <span>[B] Callback</span>
                    <span>[N] No Answer</span>
                    <span>[Esc] Skip</span>
                </div>
            )}
        </div>
    );
}
