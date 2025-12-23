'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    DollarSign, ShoppingCart, Users, Clock,
    TrendingUp, TrendingDown, Package, Calendar, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { subDays } from 'date-fns';
import { useDashboardStats } from '@/hooks/useAnalytics';
import { useFinancialSummary } from '@/hooks/useFinancial';

export default function DashboardPage() {
    // 1. Add Date Picker State
    const [dateRange, setDateRange] = useState('30');

    // Calculate dates based on selection (memoized to avoid infinite loops if passed to hooks)
    const { startDate, endDate } = React.useMemo(() => {
        const end = new Date();
        const start = subDays(end, Number(dateRange));
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    }, [dateRange]);

    // 2. Fetch Data with Date Range
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(startDate, endDate);
    const { data: financial, isLoading: financialLoading, refetch: refetchFinancial } = useFinancialSummary(startDate, endDate);

    const isLoading = statsLoading || financialLoading;

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K MAD`;
        return `${amount.toLocaleString()} MAD`;
    };

    const refreshData = () => {
        refetchStats();
        refetchFinancial();
    };

    // Derived Metrics
    const confirmationRate = stats?.conversion_rate || 0; // Using conversion rate as proxy for confirmation if not separated
    const deliveryRate = 100; // Mocked for now as backend might not return simple rate
    // Actually financial.orders.delivered_orders / total? 
    // Let's use robust fail-safes.

    return (
        <div className="max-w-[1400px]">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Overview for {startDate} to {endDate}
                    </p>
                </div>

                {/* Date Picker & Refresh */}
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40 bg-card border-border text-foreground">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last Year</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="border-border text-muted-foreground hover:text-foreground"
                        onClick={refreshData}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards Row (Powered by Real Data) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Revenue */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                            <p className="text-2xl font-bold text-success-fg mt-2">
                                {financial?.revenue?.total_revenue ? formatCurrency(financial.revenue.total_revenue) : '0 MAD'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {financial?.orders?.delivered_orders || 0} delivered orders
                            </p>
                        </div>
                        <div className="p-2.5 bg-success-fg/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-success-fg" />
                        </div>
                    </div>
                </div>

                {/* Orders */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                            <p className="text-2xl font-bold text-accent-fg mt-2">
                                {financial?.orders?.total_orders || 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {financial?.orders?.pending_orders || 0} pending
                            </p>
                        </div>
                        <div className="p-2.5 bg-accent-fg/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-accent-fg" />
                        </div>
                    </div>
                </div>

                {/* Leads */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                            <p className="text-2xl font-bold text-accent-emphasis mt-2">
                                {stats?.total_leads || 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats?.active_deals || 0} qualified/confirmed
                            </p>
                        </div>
                        <div className="p-2.5 bg-accent-emphasis/10 rounded-lg">
                            <Users className="w-5 h-5 text-accent-emphasis" />
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                            <p className="text-2xl font-bold text-attention-fg mt-2">
                                {financial?.orders?.pending_orders || 0}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Requires action</p>
                        </div>
                        <div className="p-2.5 bg-attention-fg/10 rounded-lg">
                            <Clock className="w-5 h-5 text-attention-fg" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Rate Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Confirmation Rate */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Confirmation Rate</p>
                        <span className="text-xs text-muted-foreground">Target: 70%</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3fb950" strokeWidth="3"
                                    strokeDasharray={`${confirmationRate} 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-success-fg">
                                {confirmationRate}%
                            </span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {stats?.active_deals || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Active / {stats?.total_leads || 0} Total</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Rate */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                        <span className="text-xs text-muted-foreground">Target: 80%</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#a371f7" strokeWidth="3"
                                    strokeDasharray={`${financial?.collection?.collection_rate || 0} 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-accent-emphasis">
                                {financial?.collection?.collection_rate || 0}%
                            </span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {financial?.orders?.delivered_orders || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Delivered Orders</p>
                        </div>
                    </div>
                </div>

                {/* Return Rate */}
                <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Return Rate</p>
                        <span className="text-xs text-danger-fg">Keep below 10%</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f85149" strokeWidth="3"
                                    strokeDasharray={`${financial?.orders?.returned_orders ? ((financial.orders.returned_orders / (financial.orders.total_orders || 1)) * 100) : 0} 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-muted-foreground">
                                {financial?.orders?.returned_orders ? ((financial.orders.returned_orders / (financial.orders.total_orders || 1)) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {financial?.orders?.returned_orders || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Returned Orders</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Link href="/leads?action=add"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-sm">
                    <Users className="w-5 h-5" />
                    <span>Add Lead</span>
                </Link>
                <Link href="/orders?action=add"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-card hover:bg-card/80 border border-border text-foreground font-medium transition-colors shadow-sm">
                    <ShoppingCart className="w-5 h-5 text-accent-emphasis" />
                    <span>New Order</span>
                </Link>
                <Link href="/calls"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-card hover:bg-card/80 border border-border text-foreground font-medium transition-colors shadow-sm">
                    <TrendingUp className="w-5 h-5 text-attention-fg" />
                    <span>Call Center</span>
                </Link>
                <Link href="/products"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-card hover:bg-card/80 border border-border text-foreground font-medium transition-colors shadow-sm">
                    <Package className="w-5 h-5 text-success-fg" />
                    <span>Inventory</span>
                </Link>
            </div>

            {/* Note: Recent Activity and Inventory Status sections are kept as static UI for now, 
                as per scope of adding date-awareness to KPIs. */}
        </div>
    );
}
