'use client';

import React, { useState } from 'react';
import { Check, Calendar, PhoneOff, X, Ban, SkipForward, ChevronLeft } from 'lucide-react';

const CANCEL_REASONS = [
    'Price too high',
    'Changed mind',
    'Found elsewhere',
    'Not interested',
    'Duplicate',
    'Other',
];

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

    // Base button style
    const baseBtn = "flex flex-col items-center justify-center gap-1 min-w-[90px] py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200";

    return (
        <div className="p-3 bg-background border-t border-border">
            {!showCancelMenu ? (
                <>
                    {/* Main Buttons Row */}
                    <div className="flex items-stretch justify-center gap-2">
                        {/* Confirmed - GREEN */}
                        <button
                            onClick={onConfirm}
                            disabled={confirmDisabled || isProcessing}
                            className={`${baseBtn} ${confirmDisabled || isProcessing
                                    ? 'bg-secondary text-muted-foreground/50 cursor-not-allowed border border-border'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:scale-105'
                                }`}
                        >
                            <Check size={18} />
                            <span>Confirm</span>
                            <span className="text-[10px] opacity-60">[C]</span>
                        </button>

                        {/* Callback - ORANGE */}
                        <button
                            onClick={onCallback}
                            disabled={isProcessing}
                            className={`${baseBtn} bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30 hover:scale-105 disabled:opacity-50`}
                        >
                            <Calendar size={18} />
                            <span>Callback</span>
                            <span className="text-[10px] opacity-60">[B]</span>
                        </button>

                        {/* No Answer - CYAN */}
                        <button
                            onClick={onNoAnswer}
                            disabled={isProcessing}
                            className={`${baseBtn} bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 hover:scale-105 disabled:opacity-50`}
                        >
                            <PhoneOff size={18} />
                            <span>No Answer</span>
                            <span className="text-[10px] opacity-60">[N]</span>
                        </button>

                        {/* Cancel - RED */}
                        <button
                            onClick={() => setShowCancelMenu(true)}
                            disabled={isProcessing}
                            className={`${baseBtn} bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 hover:scale-105 disabled:opacity-50`}
                        >
                            <X size={18} />
                            <span>Cancel</span>
                            <span className="text-[10px] opacity-60">▼</span>
                        </button>

                        {/* Divider */}
                        <div className="w-px bg-border mx-1 self-stretch" />

                        {/* Wrong # - DARK */}
                        <button
                            onClick={onWrongNumber}
                            disabled={isProcessing}
                            className={`${baseBtn} bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border disabled:opacity-50`}
                        >
                            <Ban size={18} />
                            <span>Wrong #</span>
                        </button>

                        {/* Skip - DARK */}
                        <button
                            onClick={onSkip}
                            disabled={isProcessing}
                            className={`${baseBtn} bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border disabled:opacity-50`}
                        >
                            <SkipForward size={18} />
                            <span>Skip</span>
                            <span className="text-[10px] opacity-60">[Esc]</span>
                        </button>
                    </div>

                    {/* Keyboard Hints */}
                    <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-muted-foreground/50">
                        <span>[C] Confirm</span>
                        <span>[B] Callback</span>
                        <span>[N] No Answer</span>
                        <span>[Esc] Skip</span>
                    </div>
                </>
            ) : (
                /* Cancel Reasons Panel */
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-foreground">Select cancellation reason:</span>
                        <button
                            onClick={() => setShowCancelMenu(false)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft size={16} /> Back
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
                                className="py-2.5 px-3 bg-secondary hover:bg-red-600/20 hover:border-red-500/50 border border-border rounded-lg text-foreground text-xs font-medium transition-colors disabled:opacity-50"
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
