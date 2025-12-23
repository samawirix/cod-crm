import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red';
    className?: string;
}

const variantStyles = {
    default: 'bg-slate-900/60',
    blue: 'bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-transparent border-blue-500/20',
    green: 'bg-gradient-to-br from-emerald-600/20 via-emerald-600/10 to-transparent border-emerald-500/20',
    purple: 'bg-gradient-to-br from-purple-600/20 via-purple-600/10 to-transparent border-purple-500/20',
    orange: 'bg-gradient-to-br from-orange-600/20 via-orange-600/10 to-transparent border-orange-500/20',
    red: 'bg-gradient-to-br from-red-600/20 via-red-600/10 to-transparent border-red-500/20',
};

const iconStyles = {
    default: 'text-slate-400',
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
};

const valueStyles = {
    default: 'text-white',
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
};

export function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = 'default',
    className,
}: KPICardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl p-5",
                "backdrop-blur-sm border border-slate-800/50",
                "transition-all duration-300 hover:scale-[1.02]",
                "group",
                variantStyles[variant],
                className
            )}
        >
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            </div>

            <div className="relative flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className={cn("text-2xl font-bold tracking-tight", valueStyles[variant])}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-slate-500">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium",
                            trend.isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                <div className={cn(
                    "p-3 rounded-xl bg-slate-800/50",
                    "transition-transform duration-300 group-hover:scale-110"
                )}>
                    <Icon className={cn("h-6 w-6", iconStyles[variant])} />
                </div>
            </div>
        </div>
    );
}
