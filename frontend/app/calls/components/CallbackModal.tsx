'use client';

import React, { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

interface CallbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (dateTime: string) => void;
    leadName?: string;
    mode: 'quick' | 'full';  // 'quick' for in-call picker, 'full' for detailed scheduler
}

export default function CallbackModal({
    isOpen,
    onClose,
    onSchedule,
    leadName,
    mode,
}: CallbackModalProps) {
    const [callbackDateTime, setCallbackDateTime] = useState('');
    const [callbackDate, setCallbackDate] = useState('');
    const [callbackTime, setCallbackTime] = useState('');
    const [callbackNotes, setCallbackNotes] = useState('');

    if (!isOpen) return null;

    const handleQuickOption = (hours?: number, value?: string) => {
        const now = new Date();
        let target: Date;
        if (hours) {
            target = new Date(now.getTime() + hours * 60 * 60 * 1000);
        } else if (value) {
            const hour = parseInt(value.replace('tomorrow', ''));
            target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, 0);
        } else {
            return;
        }
        setCallbackDateTime(target.toISOString().slice(0, 16));
    };

    const handleQuickMinutes = (minutes: number) => {
        const date = new Date();
        date.setMinutes(date.getMinutes() + minutes);
        setCallbackDate(date.toISOString().split('T')[0]);
        setCallbackTime(date.toTimeString().slice(0, 5));
    };

    const handleSchedule = () => {
        if (mode === 'quick' && callbackDateTime) {
            onSchedule(callbackDateTime);
        } else if (mode === 'full' && callbackDate && callbackTime) {
            onSchedule(`${callbackDate}T${callbackTime}`);
        }
    };

    // Quick mode - simpler picker for in-call use
    if (mode === 'quick') {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-[400px]">
                    <h3 className="text-lg font-semibold text-[#e6edf3] mb-4">
                        📅 Schedule Callback
                    </h3>

                    <input
                        type="datetime-local"
                        value={callbackDateTime}
                        onChange={(e) => setCallbackDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm mb-4"
                    />

                    {/* Quick Options */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                            { label: '1 Hour', hours: 1 },
                            { label: '2 Hours', hours: 2 },
                            { label: '4 Hours', hours: 4 },
                            { label: 'Tomorrow 10AM', value: 'tomorrow10' },
                            { label: 'Tomorrow 2PM', value: 'tomorrow14' },
                            { label: 'Tomorrow 6PM', value: 'tomorrow18' },
                        ].map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => handleQuickOption(opt.hours, opt.value)}
                                className="p-2 bg-[#21262d] border border-[#30363d] rounded-md text-[#e6edf3] text-xs cursor-pointer hover:bg-[#30363d] transition-colors"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 p-3 bg-[#21262d] border border-[#30363d] rounded-md text-[#e6edf3] cursor-pointer hover:bg-[#30363d] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSchedule}
                            disabled={!callbackDateTime}
                            className={`flex-1 p-3 rounded-md text-white font-semibold transition-colors ${callbackDateTime
                                    ? 'bg-[#9e6a03] cursor-pointer hover:bg-[#b37703]'
                                    : 'bg-[#21262d] cursor-not-allowed'
                                }`}
                        >
                            Schedule
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Full mode - detailed scheduler with date/time/notes
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] w-full max-w-[400px] p-5">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d29922]/20 flex items-center justify-center">
                            <Calendar size={20} className="text-[#d29922]" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[#e6edf3] m-0">Schedule Callback</h3>
                            {leadName && <p className="text-xs text-[#8b949e] m-0">{leadName}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-transparent border-none cursor-pointer rounded-md hover:bg-[#21262d] transition-colors"
                    >
                        <X size={20} className="text-[#8b949e]" />
                    </button>
                </div>

                {/* Quick Time Buttons */}
                <div className="mb-4">
                    <p className="text-xs text-[#8b949e] mb-2">Quick Schedule:</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: '30 min', minutes: 30 },
                            { label: '1 hour', minutes: 60 },
                            { label: '2 hours', minutes: 120 },
                            { label: 'Tomorrow', minutes: 1440 },
                        ].map((option) => (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => handleQuickMinutes(option.minutes)}
                                className="p-2 bg-[#21262d] border border-[#30363d] rounded-md text-[#e6edf3] text-xs cursor-pointer hover:bg-[#30363d] transition-colors"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Input */}
                <div className="mb-4">
                    <label className="flex items-center gap-2 text-xs text-[#8b949e] mb-2">
                        <Calendar size={14} /> Date
                    </label>
                    <input
                        type="date"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm"
                    />
                </div>

                {/* Time Input */}
                <div className="mb-4">
                    <label className="flex items-center gap-2 text-xs text-[#8b949e] mb-2">
                        <Clock size={14} /> Time
                    </label>
                    <input
                        type="time"
                        value={callbackTime}
                        onChange={(e) => setCallbackTime(e.target.value)}
                        className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm"
                    />
                </div>

                {/* Notes */}
                <div className="mb-5">
                    <label className="text-xs text-[#8b949e] mb-2 block">Notes (Optional)</label>
                    <textarea
                        value={callbackNotes}
                        onChange={(e) => setCallbackNotes(e.target.value)}
                        placeholder="Add notes for this callback..."
                        rows={3}
                        className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm resize-none"
                    />
                </div>

                {/* Preview */}
                {callbackDate && callbackTime && (
                    <div className="mb-5 p-3 bg-[#d29922]/10 border border-[#d29922]/30 rounded-lg">
                        <p className="text-sm text-[#d29922]">
                            📅 Callback scheduled for:{' '}
                            <span className="font-semibold">
                                {new Date(`${callbackDate}T${callbackTime}`).toLocaleString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 p-3 bg-[#21262d] border border-[#30363d] rounded-md text-[#e6edf3] cursor-pointer hover:bg-[#30363d] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSchedule}
                        disabled={!callbackDate || !callbackTime}
                        className={`flex-1 p-3 rounded-md text-white font-semibold flex items-center justify-center gap-2 transition-colors ${callbackDate && callbackTime
                                ? 'bg-[#9e6a03] cursor-pointer hover:bg-[#b37703]'
                                : 'bg-[#21262d] cursor-not-allowed'
                            }`}
                    >
                        <Calendar size={16} /> Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}
