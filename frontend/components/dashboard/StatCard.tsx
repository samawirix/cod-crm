
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color?: string; // Expects values like "text-blue-500", "text-emerald-500" or raw specific colors
    trend?: {
        value: number;
        isUp: boolean;
    };
}

// Map text colors to their corresponding background tints for the icon wrapper
const colorMap: Record<string, string> = {
    "text-emerald-500": "bg-emerald-500/10 text-emerald-500",
    "text-green-500": "bg-green-500/10 text-green-500",
    "text-blue-500": "bg-blue-500/10 text-blue-500",
    "text-purple-500": "bg-purple-500/10 text-purple-500",
    "text-orange-500": "bg-orange-500/10 text-orange-500",
    "text-red-500": "bg-red-500/10 text-red-500",
    "text-cyan-500": "bg-cyan-500/10 text-cyan-500",
    "text-yellow-500": "bg-yellow-500/10 text-yellow-500",
    "text-indigo-500": "bg-indigo-500/10 text-indigo-500",
    "text-pink-500": "bg-pink-500/10 text-pink-500",

    // Fallback for "white" or undefined
    "text-white": "bg-slate-700 text-slate-300",
    "default": "bg-slate-700 text-slate-300"
};

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
    // Determine the icon wrapper style based on the passed color prop
    // We try to match the prop, otherwise fall back to default
    const colorKey = color || 'default';
    const iconStyle = colorMap[colorKey] || colorMap['default'];

    return (
        <Card className="bg-slate-800 border-slate-700 hover:bg-slate-800/80 transition-colors">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-400">{title}</p>
                        <p className={`text-2xl font-bold ${color || 'text-white'}`}>
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={`flex items-center text-xs mt-2 ${trend.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {trend.isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                <span className="font-medium">{trend.value}% vs last period</span>
                            </div>
                        )}
                    </div>
                    {/* Fixed size wrapper with Flex centering - CRITICAL FIX */}
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}>
                        {/* Explicit size for Lucide Icon */}
                        <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
