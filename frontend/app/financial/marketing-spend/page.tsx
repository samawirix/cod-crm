'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingDown, Plus, Trash2, RefreshCw,
    Facebook, Target, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import MarketingSpendImporter from '@/components/MarketingSpendImporter';

const platformColors: Record<string, string> = {
    FACEBOOK: 'bg-blue-600',
    INSTAGRAM: 'bg-pink-600',
    TIKTOK: 'bg-slate-800',
    GOOGLE: 'bg-red-600',
    SNAPCHAT: 'bg-yellow-500',
};

interface UnitEconomicsMetric {
    metric: string;
    value: number;
    status: string;
    ad_spend?: number;
    leads_count?: number;
    orders_count?: number;
    delivered_count?: number;
    delivery_rate?: number;
    revenue?: number;
}

interface UnitEconomicsSummary {
    cpl: UnitEconomicsMetric;
    cpo: UnitEconomicsMetric;
    cpd: UnitEconomicsMetric;
    roas: UnitEconomicsMetric;
}

interface AdSpendRecord {
    id: number;
    date: string;
    platform: string;
    amount: number;
    leads_generated: number;
    notes?: string;
}

export default function MarketingSpendPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [spendRecords, setSpendRecords] = useState<AdSpendRecord[]>([]);
    const [unitEconomics, setUnitEconomics] = useState<UnitEconomicsSummary | null>(null);
    const [spendForm, setSpendForm] = useState({
        date: new Date().toISOString().split('T')[0],
        platform: 'FACEBOOK',
        amount: '',
        leads_generated: '',
    });

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch unit economics
            const economicsRes = await apiClient.get('/api/v1/unit-economics/summary');
            setUnitEconomics(economicsRes.data);

            // Fetch ad spend records
            const spendRes = await apiClient.get('/api/v1/ad-spend/');
            setSpendRecords(spendRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSpend = async () => {
        if (!spendForm.amount) return;

        setIsSaving(true);
        try {
            await apiClient.post('/api/v1/ad-spend/', {
                date: spendForm.date,
                platform: spendForm.platform,
                amount: parseFloat(spendForm.amount),
                leads_generated: parseInt(spendForm.leads_generated) || 0,
            });

            setSpendForm({ ...spendForm, amount: '', leads_generated: '' });
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to save spend:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSpend = async (id: number) => {
        try {
            await apiClient.delete(`/api/v1/ad-spend/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete spend:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'text-green-500';
            case 'warning': return 'text-yellow-500';
            case 'bad': return 'text-red-500';
            default: return 'text-slate-400';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'good': return 'bg-green-600';
            case 'warning': return 'bg-yellow-600';
            case 'bad': return 'bg-red-600';
            default: return 'bg-slate-600';
        }
    };

    const totalSpend = spendRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalLeads = spendRecords.reduce((sum, r) => sum + r.leads_generated, 0);
    const avgCPL = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0';

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingDown className="h-7 w-7 text-red-500" />
                        Marketing Spend & Unit Economics
                    </h1>
                    <p className="text-slate-400">Track ad spend and calculate your real cost per acquisition</p>
                </div>
                <div className="flex items-center gap-3">
                    <MarketingSpendImporter onImportComplete={fetchData} />
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={fetchData}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Unit Economics KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-400">Cost Per Lead (CPL)</p>
                            {unitEconomics?.cpl && (
                                <Badge className={getStatusBadgeColor(unitEconomics.cpl.status)}>
                                    {unitEconomics.cpl.status}
                                </Badge>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${getStatusColor(unitEconomics?.cpl?.status || 'good')}`}>
                            {unitEconomics?.cpl?.value || 0} MAD
                        </p>
                        <p className="text-xs text-slate-500">Target: &lt;30 MAD</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-400">Cost Per Order (CPO)</p>
                            {unitEconomics?.cpo && (
                                <Badge className={getStatusBadgeColor(unitEconomics.cpo.status)}>
                                    {unitEconomics.cpo.status}
                                </Badge>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${getStatusColor(unitEconomics?.cpo?.status || 'good')}`}>
                            {unitEconomics?.cpo?.value || 0} MAD
                        </p>
                        <p className="text-xs text-slate-500">Target: &lt;80 MAD</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-400">Cost Per Delivered (CPD)</p>
                            {unitEconomics?.cpd && (
                                <Badge className={getStatusBadgeColor(unitEconomics.cpd.status)}>
                                    {unitEconomics.cpd.status}
                                </Badge>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${getStatusColor(unitEconomics?.cpd?.status || 'warning')}`}>
                            {unitEconomics?.cpd?.value || 0} MAD
                        </p>
                        <p className="text-xs text-slate-500">Target: &lt;100 MAD ⭐</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-400">ROAS</p>
                            {unitEconomics?.roas && (
                                <Badge className={getStatusBadgeColor(unitEconomics.roas.status)}>
                                    {unitEconomics.roas.status}
                                </Badge>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${getStatusColor(unitEconomics?.roas?.status || 'good')}`}>
                            {unitEconomics?.roas?.value || 0}x
                        </p>
                        <p className="text-xs text-slate-500">Target: &gt;3x</p>
                    </CardContent>
                </Card>
            </div>

            {/* Add Spend Form */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add Daily Ad Spend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <Label className="text-slate-300">Date</Label>
                            <Input
                                type="date"
                                value={spendForm.date}
                                onChange={(e) => setSpendForm({ ...spendForm, date: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Platform</Label>
                            <Select
                                value={spendForm.platform}
                                onValueChange={(v) => setSpendForm({ ...spendForm, platform: v })}
                            >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="FACEBOOK" className="text-white">Facebook</SelectItem>
                                    <SelectItem value="INSTAGRAM" className="text-white">Instagram</SelectItem>
                                    <SelectItem value="TIKTOK" className="text-white">TikTok</SelectItem>
                                    <SelectItem value="GOOGLE" className="text-white">Google Ads</SelectItem>
                                    <SelectItem value="SNAPCHAT" className="text-white">Snapchat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-slate-300">Amount Spent (MAD)</Label>
                            <Input
                                type="number"
                                placeholder="500"
                                value={spendForm.amount}
                                onChange={(e) => setSpendForm({ ...spendForm, amount: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Leads Generated</Label>
                            <Input
                                type="number"
                                placeholder="25"
                                value={spendForm.leads_generated}
                                onChange={(e) => setSpendForm({ ...spendForm, leads_generated: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleSaveSpend}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={!spendForm.amount || isSaving}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Spend'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Spend Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700">
                    <CardContent className="p-4">
                        <p className="text-red-400 text-sm">Total Ad Spend</p>
                        <p className="text-2xl font-bold text-white">{totalSpend.toLocaleString()} MAD</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
                    <CardContent className="p-4">
                        <p className="text-blue-400 text-sm">Total Leads</p>
                        <p className="text-2xl font-bold text-white">{totalLeads}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
                    <CardContent className="p-4">
                        <p className="text-green-400 text-sm">Avg CPL</p>
                        <p className="text-2xl font-bold text-white">{avgCPL} MAD</p>
                    </CardContent>
                </Card>
            </div>

            {/* Spend Records Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Spend History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Platform</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Leads</th>
                                    <th className="p-4">CPL</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                ) : spendRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">
                                            No ad spend records yet. Add your first entry above!
                                        </td>
                                    </tr>
                                ) : (
                                    spendRecords.map((record) => {
                                        const cpl = record.leads_generated > 0
                                            ? (record.amount / record.leads_generated).toFixed(2)
                                            : '-';

                                        return (
                                            <tr key={record.id} className="border-b border-slate-700/50 text-white hover:bg-slate-700/30">
                                                <td className="p-4">{record.date}</td>
                                                <td className="p-4">
                                                    <Badge className={`${platformColors[record.platform] || 'bg-slate-600'} text-white`}>
                                                        {record.platform}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 font-medium text-red-400">{record.amount} MAD</td>
                                                <td className="p-4">{record.leads_generated}</td>
                                                <td className="p-4">
                                                    <span className={parseFloat(cpl as string) < 30 ? 'text-green-400' : 'text-yellow-400'}>
                                                        {cpl} MAD
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-400 hover:text-red-300"
                                                        onClick={() => handleDeleteSpend(record.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
