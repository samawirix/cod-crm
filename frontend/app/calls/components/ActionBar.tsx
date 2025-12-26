'use client';

import React, { useState } from 'react';
import { CheckCircle, Calendar, PhoneMissed, XCircle, PhoneOff, SkipForward, ArrowLeft } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// CANCEL REASONS
// ═══════════════════════════════════════════════════════════════
const CANCEL_REASONS = [
    'Price too high',
    'Changed mind',
    'Found elsewhere',
    'Not interested',
    'Duplicate order',
    'Other',
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
    const [showCancelMenu, setShowCancelMenu] = useState(false);

    const iconSize = 20;

    return (
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117]">
            {!showCancelMenu ? (
                <>
                    <div className="flex items-center justify-center gap-3">
                        {/* Confirmed - SOLID GREEN */}
                        <button
                            onClick={onConfirm}
                            disabled={confirmDisabled || isProcessing}
                            className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl font-medium transition-all ${confirmDisabled || isProcessing
                                    ? 'bg-emerald-600/30 text-emerald-200/50 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 shadow-lg shadow-emerald-600/20'
                                }`}
                        >
                            <CheckCircle size={iconSize} />
                            <span className="text-sm">Confirmed</span>
                            <span className="text-[10px] opacity-70">[C]</span>
                        </button>

                        {/* Callback - SOLID AMBER/ORANGE */}
                        <button
                            onClick={onCallback}
                            disabled={isProcessing}
                            className="flex flex-col items-center gap-1 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                        >
                            <Calendar size={iconSize} />
                            <span className="text-sm">Callback</span>
                            <span className="text-[10px] opacity-70">[B]</span>
                        </button>

                        {/* No Answer - SOLID CYAN */}
                        <button
                            onClick={onNoAnswer}
                            disabled={isProcessing}
                            className="flex flex-col items-center gap-1 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                        >
                            <PhoneMissed size={iconSize} />
                            <span className="text-sm">No Answer</span>
                            <span className="text-[10px] opacity-70">[N]</span>
                        </button>

                        {/* Cancel - SOLID RED with dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCancelMenu(!showCancelMenu)}
                                disabled={isProcessing}
                                className="flex flex-col items-center gap-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-red-600/20 disabled:opacity-50"
                            >
                                <XCircle size={iconSize} />
                                <span className="text-sm">Cancel</span>
                                <span className="text-[10px] opacity-70">▼</span>
                            </button>
                        </div>

                        {/* Wrong # - DARK/OUTLINED */}
                        <button
                            onClick={onWrongNumber}
                            disabled={isProcessing}
                            className="flex flex-col items-center gap-1 px-5 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-xl font-medium border border-[#30363d] transition-colors disabled:opacity-50"
                        >
                            <PhoneOff size={iconSize} />
                            <span className="text-sm">Wrong #</span>
                        </button>

                        {/* Skip - DARK/OUTLINED */}
                        <button
                            onClick={onSkip}
                            disabled={isProcessing}
                            className="flex flex-col items-center gap-1 px-5 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-xl font-medium border border-[#30363d] transition-colors disabled:opacity-50"
                        >
                            <SkipForward size={iconSize} />
                            <span className="text-sm">Skip</span>
                            <span className="text-[10px] opacity-70">[Esc]</span>
                        </button>
                    </div>

                    {/* Keyboard shortcuts hint */}
                    <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-[#8b949e]">
                        <span>[C] Confirm</span>
                        <span>[B] Callback</span>
                        <span>[N] No Answer</span>
                        <span>[Esc] Skip</span>
                    </div>
                </>
            ) : (
                /* Cancel Reasons Panel */
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-[#e6edf3]">Select cancellation reason:</span>
                        <button
                            onClick={() => setShowCancelMenu(false)}
                            className="bg-transparent border-none text-[#8b949e] hover:text-[#e6edf3] cursor-pointer flex items-center gap-1 text-sm"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {CANCEL_REASONS.map(reason => (
                            <button
                                key={reason}
                                onClick={() => {
                                    onCancel(reason);
                                    setShowCancelMenu(false);
                                }}
                                disabled={isProcessing}
                                className="py-3 px-3 rounded-lg text-[#e6edf3] text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d]"
                            >
                                {reason}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
