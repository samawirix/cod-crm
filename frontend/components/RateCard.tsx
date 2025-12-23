'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface RateCardProps {
    title: string;
    rate: number;
    subtitle?: string;
    target?: number;
    icon?: LucideIcon;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'emerald';
    alertThreshold?: number; // If rate crosses this, show alert styling
    alertDirection?: 'above' | 'below'; // Alert if above or below threshold
    size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
    blue: { ring: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-500' },
    green: { ring: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-500' },
    emerald: { ring: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    yellow: { ring: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    red: { ring: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-500' },
    purple: { ring: '#a855f7', bg: 'bg-purple-500/10', text: 'text-purple-500' },
};

const sizeMap = {
    sm: { width: 60, stroke: 4, fontSize: 'text-sm' },
    md: { width: 80, stroke: 5, fontSize: 'text-lg' },
    lg: { width: 100, stroke: 6, fontSize: 'text-xl' },
};

export default function RateCard({
    title,
    rate,
    subtitle,
    target,
    icon: Icon,
    color = 'blue',
    alertThreshold,
    alertDirection = 'above',
    size = 'md',
}: RateCardProps) {
    // Determine if alert condition is met
    const isAlert = alertThreshold !== undefined && (
        (alertDirection === 'above' && rate > alertThreshold) ||
        (alertDirection === 'below' && rate < alertThreshold)
    );

    // Use red color if alert condition is met
    const activeColor = isAlert ? 'red' : color;
    const colors = colorMap[activeColor];
    const sizes = sizeMap[size];

    // SVG calculations
    const radius = (sizes.width - sizes.stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const normalizedRate = Math.min(Math.max(rate, 0), 100);
    const offset = circumference - (normalizedRate / 100) * circumference;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative" style={{ width: sizes.width, height: sizes.width }}>
                <svg
                    width={sizes.width}
                    height={sizes.width}
                    className="transform -rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={sizes.width / 2}
                        cy={sizes.width / 2}
                        r={radius}
                        fill="none"
                        stroke="#334155"
                        strokeWidth={sizes.stroke}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={sizes.width / 2}
                        cy={sizes.width / 2}
                        r={radius}
                        fill="none"
                        stroke={colors.ring}
                        strokeWidth={sizes.stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-bold ${sizes.fontSize} ${colors.text}`}>
                        {rate.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                            <Icon className={`h-4 w-4 ${colors.text}`} />
                        </div>
                    )}
                    <p className="text-white font-medium">{title}</p>
                </div>
                {subtitle && (
                    <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
                )}
                {target !== undefined && (
                    <p className={`text-xs mt-1 ${rate >= target ? 'text-green-500' : 'text-yellow-500'}`}>
                        Target: {target}%
                    </p>
                )}
                {isAlert && (
                    <p className="text-red-500 text-xs font-medium mt-1">
                        ⚠️ {alertDirection === 'above' ? 'Above' : 'Below'} threshold ({alertThreshold}%)
                    </p>
                )}
            </div>
        </div>
    );
}
