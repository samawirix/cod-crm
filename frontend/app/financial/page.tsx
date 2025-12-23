'use client';

import React, { useState } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard,
    ShoppingCart, Package, RotateCcw,
    Calendar, RefreshCw, Download, ArrowUpRight, ArrowDownRight,
    Wallet, PiggyBank, Receipt, MapPin
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { subDays } from 'date-fns';
import {
    useFinancialSummary,
    useRevenueByDay,
    useRevenueByProduct,
    useRevenueByCity,
    useMonthlyComparison,
    useProfitAnalysis
} from '@/hooks/useFinancial';
import { RevenueByProduct, RevenueByCity } from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];



export default function FinancialPage() {
    const [dateRange, setDateRange] = useState('30');

    // Calculate dates - memoized to prevent infinite re-renders
    const { startDate, endDate } = React.useMemo(() => {
        const end = new Date();
        const start = subDays(end, Number(dateRange));
        // Use ISO date format without time to ensure stability
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    }, [dateRange]);

    // Fetch all data
    const { data: summary, isLoading, refetch } = useFinancialSummary(startDate, endDate);
    const { data: revenueByDay } = useRevenueByDay(startDate, endDate);
    const { data: revenueByProduct } = useRevenueByProduct(startDate, endDate);
    const { data: revenueByCity } = useRevenueByCity(startDate, endDate);
    const { data: monthlyData } = useMonthlyComparison(6);
    const { data: profitAnalysis } = useProfitAnalysis(startDate, endDate);

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M MAD`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K MAD`;
        return `${amount.toLocaleString()} MAD`;
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="h-7 w-7 text-emerald-500" />
                        Financial Dashboard
                    </h1>
                    <p className="text-slate-400">Track revenue, costs, and profitability</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(summary?.revenue?.total_revenue || 0)}
                    subtitle={`${summary?.orders?.delivered_orders || 0} delivered orders`}
                    icon={DollarSign}
                    color="text-emerald-500"
                />
                <StatCard
                    title="Gross Profit"
                    value={formatCurrency(summary?.profit?.gross_profit || 0)}
                    subtitle={`${summary?.profit?.gross_margin || 0}% margin`}
                    icon={TrendingUp}
                    color="text-green-500"
                />
                <StatCard
                    title="Net Profit (After Ads)"
                    value={formatCurrency(summary?.ad_spend?.net_profit || summary?.profit?.gross_profit || 0)}
                    subtitle={`Ad Spend: ${formatCurrency(summary?.ad_spend?.total_ad_spend || 0)} | ROAS: ${summary?.ad_spend?.roas || 0}x`}
                    icon={TrendingUp}
                    color={Number(summary?.ad_spend?.net_profit || summary?.profit?.gross_profit || 0) > 0 ? "text-emerald-500" : "text-red-500"}
                />
                <StatCard
                    title="Returned/Lost"
                    value={formatCurrency((summary?.revenue?.returned_amount || 0) + (summary?.revenue?.cancelled_amount || 0))}
                    subtitle={`${summary?.orders?.returned_orders || 0} returned, ${summary?.orders?.cancelled_orders || 0} cancelled`}
                    icon={RotateCcw}
                    color="text-red-500"
                />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Avg Order Value"
                    value={`${summary?.orders?.avg_order_value || 0} MAD`}
                    icon={ShoppingCart}
                    color="text-blue-500"
                />
                <StatCard
                    title="Collection Rate"
                    value={`${summary?.collection?.collection_rate || 0}%`}
                    subtitle={`${formatCurrency(summary?.collection?.pending_collection || 0)} pending`}
                    icon={CreditCard}
                    color="text-purple-500"
                />
                <StatCard
                    title="Total COGS"
                    value={formatCurrency(summary?.costs?.cogs || 0)}
                    icon={Receipt}
                    color="text-orange-500"
                />
                <StatCard
                    title="Shipping Revenue"
                    value={formatCurrency(summary?.revenue?.shipping_revenue || 0)}
                    icon={Package}
                    color="text-cyan-500"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Over Time */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Revenue Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueByDay || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`${value} MAD`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Monthly Comparison */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Monthly Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`${value} MAD`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue by Product */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-500" />
                            Revenue by Product
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(revenueByProduct || []).length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No product revenue data available</p>
                                    <p className="text-sm">Complete some orders with products to see data</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(revenueByProduct || []).slice(0, 5).map((product: RevenueByProduct, index: number) => (
                                    <div key={product.product_sku} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-white text-sm truncate max-w-[200px]">{product.product_name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-emerald-400 font-semibold">{product.revenue} MAD</span>
                                                <span className="text-slate-400 text-sm ml-2">({product.quantity_sold} sold)</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(product.revenue / (revenueByProduct?.[0]?.revenue || 1)) * 100}%`,
                                                    backgroundColor: COLORS[index % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue by City */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-cyan-500" />
                            Revenue by City
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(revenueByCity || []).length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No city revenue data available</p>
                                    <p className="text-sm">Complete some orders to see data</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={revenueByCity || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ city, percent }: { city: string; percent: number }) => `${city} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="revenue"
                                        nameKey="city"
                                    >
                                        {(revenueByCity || []).map((entry: RevenueByCity, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                                        formatter={(value: number) => [`${value} MAD`, 'Revenue']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Profit Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Profitable Products */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Top Profitable Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(profitAnalysis?.top_profitable_products || []).length === 0 ? (
                            <p className="text-slate-400 text-center py-8">No profit data available yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                            <th className="pb-3">Product</th>
                                            <th className="pb-3 text-right">Revenue</th>
                                            <th className="pb-3 text-right">Profit</th>
                                            <th className="pb-3 text-right">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(profitAnalysis?.top_profitable_products || []).map((product: any, index: number) => (
                                            <tr key={index} className="text-white border-b border-slate-700/50">
                                                <td className="py-3 truncate max-w-[150px]">{product.name}</td>
                                                <td className="py-3 text-right">{product.revenue} MAD</td>
                                                <td className="py-3 text-right text-green-400">{product.profit} MAD</td>
                                                <td className="py-3 text-right">
                                                    <Badge className="bg-green-600">
                                                        {product.revenue > 0 ? ((product.profit / product.revenue) * 100).toFixed(0) : 0}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Profit Summary */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <PiggyBank className="h-5 w-5 text-emerald-500" />
                            Profit Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                <span className="text-slate-400">Total Revenue</span>
                                <span className="text-xl font-bold text-white">
                                    {formatCurrency(profitAnalysis?.summary?.total_revenue || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                <span className="text-slate-400">Total COGS</span>
                                <span className="text-xl font-bold text-red-400">
                                    -{formatCurrency(profitAnalysis?.summary?.total_cost || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                <span className="text-slate-400">Shipping Collected</span>
                                <span className="text-xl font-bold text-cyan-400">
                                    +{formatCurrency(profitAnalysis?.summary?.shipping_collected || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                                <span className="text-slate-400">Discounts Given</span>
                                <span className="text-xl font-bold text-orange-400">
                                    -{formatCurrency(profitAnalysis?.summary?.discounts_given || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-emerald-900/30 rounded-lg border border-emerald-700">
                                <span className="text-emerald-400 font-medium">Gross Profit</span>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-emerald-400">
                                        {formatCurrency(profitAnalysis?.summary?.gross_profit || 0)}
                                    </span>
                                    <Badge className="ml-2 bg-emerald-600">
                                        {profitAnalysis?.summary?.gross_margin || 0}% margin
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
