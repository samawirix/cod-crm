'use client';

import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Users, Phone,
    CheckCircle, XCircle, Truck, Package,
    Calendar, Download, RefreshCw, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
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
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { subDays } from 'date-fns';
import {
    useDashboardStats,
    useLeadsByDay,
    useLeadsBySource,
    useAgentPerformance,
    useConversionFunnel,
    useCallStatistics
} from '@/hooks/useAnalytics';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];



export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState('30');

    // Calculate dates based on selection
    const endDate = new Date().toISOString();
    const startDate = (() => {
        switch (dateRange) {
            case '7': return subDays(new Date(), 7).toISOString();
            case '30': return subDays(new Date(), 30).toISOString();
            case '90': return subDays(new Date(), 90).toISOString();
            default: return subDays(new Date(), 30).toISOString();
        }
    })();

    // Fetch all analytics data
    const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(startDate, endDate);
    const { data: leadsByDay, isLoading: leadsByDayLoading } = useLeadsByDay(startDate, endDate);
    const { data: leadsBySource, isLoading: sourceLoading } = useLeadsBySource(startDate, endDate);
    const { data: agentPerformance, isLoading: agentLoading } = useAgentPerformance(startDate, endDate);
    const { data: funnelData, isLoading: funnelLoading } = useConversionFunnel(startDate, endDate);
    const { data: callStats, isLoading: callsLoading } = useCallStatistics(startDate, endDate);

    const isLoading = statsLoading || leadsByDayLoading || sourceLoading || agentLoading || funnelLoading || callsLoading;

    // Mock data for demonstration when API is not available
    const mockLeadsByDay = leadsByDay || [
        { date: 'Dec 10', total: 45, confirmed: 32, delivered: 28 },
        { date: 'Dec 11', total: 52, confirmed: 38, delivered: 30 },
        { date: 'Dec 12', total: 48, confirmed: 35, delivered: 32 },
        { date: 'Dec 13', total: 61, confirmed: 45, delivered: 38 },
        { date: 'Dec 14', total: 55, confirmed: 42, delivered: 35 },
        { date: 'Dec 15', total: 67, confirmed: 50, delivered: 42 },
        { date: 'Dec 16', total: 72, confirmed: 55, delivered: 48 },
    ];

    const mockLeadsBySource = leadsBySource || [
        { source: 'Facebook', count: 145, percent: 0.35 },
        { source: 'Instagram', count: 98, percent: 0.24 },
        { source: 'WhatsApp', count: 82, percent: 0.20 },
        { source: 'Website', count: 56, percent: 0.14 },
        { source: 'Referral', count: 29, percent: 0.07 },
    ];

    const mockFunnelData = funnelData?.funnel || [
        { stage: 'New Leads', count: 400, percentage: 100 },
        { stage: 'Qualified', count: 320, percentage: 80 },
        { stage: 'Confirmed', count: 256, percentage: 64 },
        { stage: 'Shipped', count: 230, percentage: 58 },
        { stage: 'Delivered', count: 200, percentage: 50 },
    ];

    const mockAgentPerformance = agentPerformance || [
        { agent_id: 1, agent_name: 'Ahmed Ali', total_leads: 85, total_calls: 320, conversion_rate: 68, contact_rate: 72 },
        { agent_id: 2, agent_name: 'Sara Hassan', total_leads: 92, total_calls: 280, conversion_rate: 72, contact_rate: 78 },
        { agent_id: 3, agent_name: 'Mohamed Omar', total_leads: 78, total_calls: 350, conversion_rate: 55, contact_rate: 65 },
        { agent_id: 4, agent_name: 'Fatima Nour', total_leads: 65, total_calls: 200, conversion_rate: 82, contact_rate: 85 },
    ];

    const stats = dashboardStats?.totals || {
        total_leads: 410,
        confirmed_leads: 285,
        delivered_leads: 200,
        returned_leads: 25,
        new_leads: 85,
        qualified_leads: 65,
        shipped_leads: 45,
        refused_leads: 15,
    };

    const rates = dashboardStats?.rates || {
        confirmation_rate: 69.5,
        delivery_rate: 70.2,
        return_rate: 8.8,
    };

    const calls = callStats || {
        total_calls: 1150,
        answered: 825,
        no_answer: 325,
        contact_rate: 71.7,
        interest_breakdown: { high: 280, medium: 380, low: 165 },
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                            <p className="text-slate-400">Track your CRM performance</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="7" className="text-white hover:bg-slate-700">Last 7 days</SelectItem>
                            <SelectItem value="30" className="text-white hover:bg-slate-700">Last 30 days</SelectItem>
                            <SelectItem value="90" className="text-white hover:bg-slate-700">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => refetchStats()}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards - First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Leads"
                    value={stats.total_leads}
                    icon={Users}
                    color="text-blue-500"
                />
                <StatCard
                    title="Confirmed"
                    value={stats.confirmed_leads}
                    subtitle={`${rates.confirmation_rate}% rate`}
                    icon={CheckCircle}
                    color="text-green-500"
                />
                <StatCard
                    title="Delivered"
                    value={stats.delivered_leads}
                    subtitle={`${rates.delivery_rate}% rate`}
                    icon={Truck}
                    color="text-emerald-500"
                />
                <StatCard
                    title="Returned"
                    value={stats.returned_leads}
                    subtitle={`${rates.return_rate}% rate`}
                    icon={XCircle}
                    color="text-red-500"
                />
            </div>

            {/* KPI Cards - Second Row (Call Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Calls"
                    value={calls.total_calls}
                    icon={Phone}
                    color="text-purple-500"
                />
                <StatCard
                    title="Answered"
                    value={calls.answered}
                    subtitle={`${calls.contact_rate}% contact rate`}
                    icon={Phone}
                    color="text-green-500"
                />
                <StatCard
                    title="No Answer"
                    value={calls.no_answer}
                    icon={Phone}
                    color="text-orange-500"
                />
                <StatCard
                    title="High Interest"
                    value={calls.interest_breakdown?.high || 0}
                    icon={TrendingUp}
                    color="text-blue-500"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Leads Over Time */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Leads Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={mockLeadsByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="confirmed" stroke="#10b981" name="Confirmed" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="delivered" stroke="#8b5cf6" name="Delivered" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Leads by Source */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Leads by Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={mockLeadsBySource}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ source, percent }: { source: string; percent: number }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="source"
                                >
                                    {mockLeadsBySource.map((entry: { source: string; count: number }, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Conversion Funnel & Agent Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Conversion Funnel */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Conversion Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockFunnelData.map((stage: { stage: string; count: number; percentage: number }, index: number) => (
                                <div key={stage.stage}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-300">{stage.stage}</span>
                                        <span className="text-sm text-white font-medium">{stage.count} ({stage.percentage}%)</span>
                                    </div>
                                    <div className="h-8 bg-slate-700 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full rounded-lg transition-all duration-500"
                                            style={{
                                                width: `${stage.percentage}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Agent Performance Table */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Agent Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                        <th className="pb-3">Agent</th>
                                        <th className="pb-3">Leads</th>
                                        <th className="pb-3">Calls</th>
                                        <th className="pb-3">Conv %</th>
                                        <th className="pb-3">Contact %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockAgentPerformance.map((agent: { agent_id: number; agent_name: string; total_leads: number; total_calls: number; conversion_rate: number; contact_rate: number }) => (
                                        <tr key={agent.agent_id} className="text-white border-b border-slate-700/50">
                                            <td className="py-3 font-medium">{agent.agent_name}</td>
                                            <td className="py-3">{agent.total_leads}</td>
                                            <td className="py-3">{agent.total_calls}</td>
                                            <td className="py-3">
                                                <Badge className={agent.conversion_rate >= 60 ? 'bg-green-600' : 'bg-orange-600'}>
                                                    {agent.conversion_rate}%
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <Badge className={agent.contact_rate >= 70 ? 'bg-green-600' : 'bg-orange-600'}>
                                                    {agent.contact_rate}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Distribution */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                            { status: 'New', count: stats.new_leads },
                            { status: 'Qualified', count: stats.qualified_leads },
                            { status: 'Confirmed', count: stats.confirmed_leads },
                            { status: 'Shipped', count: stats.shipped_leads },
                            { status: 'Delivered', count: stats.delivered_leads },
                            { status: 'Returned', count: stats.returned_leads },
                            { status: 'Refused', count: stats.refused_leads },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
