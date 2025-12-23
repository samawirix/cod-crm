'use client';

import React from 'react';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    indeterminate?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Checkbox({
    checked,
    onChange,
    indeterminate = false,
    disabled = false,
    className = '',
}: CheckboxProps) {
    return (
        <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
                ref={(el) => {
                    if (el) {
                        el.indeterminate = indeterminate;
                    }
                }}
                className="sr-only peer"
            />
            <div className={`
                w-5 h-5 rounded border-2 transition-all duration-150
                flex items-center justify-center
                ${checked || indeterminate
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-transparent border-slate-500 hover:border-slate-400'
                }
                ${disabled ? '' : 'cursor-pointer'}
            `}>
                {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
                {indeterminate && !checked && (
                    <div className="w-2.5 h-0.5 bg-white rounded" />
                )}
            </div>
        </label>
    );
}
