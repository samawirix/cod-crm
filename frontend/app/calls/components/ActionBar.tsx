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

    return (
        <div className="px-4 py-3 bg-background border-t border-border">
            {!showCancelMenu ? (
                <div className="flex items-center justify-center gap-2">
                    {/* PRIMARY ACTIONS */}

                    {/* Confirm - GREEN */}
                    <button
                        onClick={onConfirm}
                        disabled={confirmDisabled || isProcessing}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${confirmDisabled || isProcessing
                                ? 'bg-secondary text-muted-foreground/50 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md'
                            }`}
                    >
                        <Check size={16} />
                        <span>Confirm</span>
                    </button>

                    {/* Callback - ORANGE */}
                    <button
                        onClick={onCallback}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <Calendar size={16} />
                        <span>Callback</span>
                    </button>

                    {/* No Answer - CYAN */}
                    <button
                        onClick={onNoAnswer}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <PhoneOff size={16} />
                        <span>No Answer</span>
                    </button>

                    {/* Cancel - RED */}
                    <button
                        onClick={() => setShowCancelMenu(true)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        <X size={16} />
                        <span>Cancel</span>
                    </button>

                    {/* DIVIDER */}
                    <div className="w-px h-8 bg-border mx-1" />

                    {/* SECONDARY ACTIONS */}

                    {/* Wrong # */}
                    <button
                        onClick={onWrongNumber}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium border border-border transition-all disabled:opacity-50"
                    >
                        <Ban size={16} />
                        <span>Wrong #</span>
                    </button>

                    {/* Skip */}
                    <button
                        onClick={onSkip}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium border border-border transition-all disabled:opacity-50"
                    >
                        <SkipForward size={16} />
                        <span>Skip</span>
                    </button>
                </div>
            ) : (
                /* CANCEL REASONS PANEL */
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Select cancellation reason:</span>
                        <button
                            onClick={() => setShowCancelMenu(false)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {CANCEL_REASONS.map(reason => (
                            <button
                                key={reason}
                                onClick={() => {
                                    onCancel(reason);
                                    setShowCancelMenu(false);
                                }}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-secondary hover:bg-red-600/20 hover:text-red-400 border border-border hover:border-red-500/50 rounded-lg text-foreground text-sm font-medium transition-all disabled:opacity-50"
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
