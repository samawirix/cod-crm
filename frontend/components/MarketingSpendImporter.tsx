'use client';

import React, { useState, useCallback } from 'react';
import {
    Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, RefreshCw, Trash2, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';

interface PreviewRecord {
    date: string;
    platform: string;
    amount: number;
    leads_generated: number;
    notes?: string;
}

interface ImportPreview {
    preview: boolean;
    records: PreviewRecord[];
    total_records: number;
    total_amount: number;
    platforms: string[];
    date_range: {
        start: string;
        end: string;
    };
    errors: string[];
}

interface ImportResult {
    success: boolean;
    message: string;
    created: number;
    updated: number;
    total_amount: number;
    date_range: {
        start: string;
        end: string;
    };
    errors: string[];
}

interface MarketingSpendImporterProps {
    onImportComplete?: () => void;
}

const platformColors: Record<string, string> = {
    FACEBOOK: 'bg-blue-600',
    INSTAGRAM: 'bg-pink-600',
    TIKTOK: 'bg-slate-800',
    GOOGLE: 'bg-red-600',
    SNAPCHAT: 'bg-yellow-500',
    OTHER: 'bg-slate-600',
};

export default function MarketingSpendImporter({ onImportComplete }: MarketingSpendImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');

    const resetState = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
            setError(null);
            handlePreview(droppedFile);
        } else {
            setError('Please upload a CSV file');
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            setError(null);
            handlePreview(selectedFile);
        } else {
            setError('Please upload a CSV file');
        }
    };

    const handlePreview = async (csvFile: File) => {
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', csvFile);

            const response = await apiClient.post(`/api/v1/ad-spend/import?preview_only=true&date_format=${encodeURIComponent(dateFormat)}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setPreview(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to parse CSV file');
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post(`/api/v1/ad-spend/import?date_format=${encodeURIComponent(dateFormat)}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
            setPreview(null);

            if (onImportComplete) {
                onImportComplete();
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to import CSV file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        resetState();
    };

    return (
        <>
            {/* Trigger Button */}
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
            >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
            </Button>

            {/* Import Dialog */}
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                            Import Marketing Spend from CSV
                        </DialogTitle>
                    </DialogHeader>

                    {/* Success Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <p className="text-emerald-400 font-medium">{result.message}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                                    <div>
                                        <p className="text-slate-400">New Records</p>
                                        <p className="text-white font-bold text-xl">{result.created}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Updated Records</p>
                                        <p className="text-white font-bold text-xl">{result.updated}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Total Amount</p>
                                        <p className="text-emerald-400 font-bold text-xl">{result.total_amount.toLocaleString()} MAD</p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* Preview Table */}
                    {preview && !result && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-400">Records</p>
                                    <p className="text-xl font-bold text-white">{preview.total_records}</p>
                                </div>
                                <div className="p-3 bg-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-400">Total Spend</p>
                                    <p className="text-xl font-bold text-emerald-400">{preview.total_amount.toLocaleString()} MAD</p>
                                </div>
                                <div className="p-3 bg-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-400">Date Range</p>
                                    <p className="text-sm text-white">{preview.date_range.start} <br />to {preview.date_range.end}</p>
                                </div>
                                <div className="p-3 bg-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-400">Platforms</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {preview.platforms.map(p => (
                                            <Badge key={p} className={`${platformColors[p] || 'bg-slate-600'} text-white text-xs`}>
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-slate-700">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-slate-800">
                                        <tr className="text-left text-slate-400 text-sm">
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Platform</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Leads</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.records.slice(0, 50).map((record, idx) => (
                                            <tr key={idx} className="border-t border-slate-700/50 text-white hover:bg-slate-700/30">
                                                <td className="p-3">{record.date}</td>
                                                <td className="p-3">
                                                    <Badge className={`${platformColors[record.platform] || 'bg-slate-600'} text-white`}>
                                                        {record.platform}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-emerald-400 font-medium">{record.amount.toLocaleString()} MAD</td>
                                                <td className="p-3">{record.leads_generated || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {preview.records.length > 50 && (
                                <p className="text-sm text-slate-400 text-center">
                                    Showing 50 of {preview.records.length} records
                                </p>
                            )}

                            {/* Errors */}
                            {preview.errors.length > 0 && (
                                <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                                    <p className="text-yellow-400 text-sm font-medium mb-2">
                                        ⚠️ {preview.errors.length} rows had issues and were skipped:
                                    </p>
                                    <ul className="text-yellow-300 text-xs space-y-1">
                                        {preview.errors.map((err, idx) => (
                                            <li key={idx}>• {err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={resetState}
                                    className="border-slate-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleConfirmImport}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                    )}
                                    {isLoading ? 'Importing...' : 'Confirm Import'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* Drop Zone */}
                    {!preview && !result && (
                        <div className="space-y-4">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    border-2 border-dashed rounded-lg p-8 text-center transition-all
                                    ${isDragging
                                        ? 'border-emerald-500 bg-emerald-900/20'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <div className="py-4">
                                        <RefreshCw className="h-10 w-10 mx-auto mb-4 text-blue-500 animate-spin" />
                                        <p className="text-slate-300">Parsing CSV file...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className={`h-10 w-10 mx-auto mb-4 ${isDragging ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <p className="text-white font-medium mb-2">
                                            {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file here'}
                                        </p>
                                        <p className="text-slate-400 text-sm mb-4">or</p>
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <span className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors">
                                                Browse Files
                                            </span>
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Date Format Selector */}
                            <div className="p-4 bg-slate-700/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Label className="text-white flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4" />
                                            Date Format
                                        </Label>
                                        <Select value={dateFormat} onValueChange={setDateFormat}>
                                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                                <SelectValue placeholder="Select date format" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                <SelectItem value="DD/MM/YYYY" className="text-white">DD/MM/YYYY (European)</SelectItem>
                                                <SelectItem value="MM/DD/YYYY" className="text-white">MM/DD/YYYY (US)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-slate-400 text-xs">
                                        <p>Choose how dates like "12/06/2024" should be interpreted:</p>
                                        <p className="mt-1">• DD/MM: June 12, 2024 (European)</p>
                                        <p>• MM/DD: December 6, 2024 (US)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Format Help */}
                            <div className="p-4 bg-slate-700/50 rounded-lg">
                                <p className="text-white font-medium mb-2">📋 Supported CSV Formats:</p>
                                <ul className="text-slate-300 text-sm space-y-1">
                                    <li>• <strong>Facebook Ads Manager</strong> - Exports with "Reporting Starts" and "Amount Spent"</li>
                                    <li>• <strong>Generic CSV</strong> - Columns: Date, Amount Spent, Campaign Name (optional)</li>
                                </ul>
                                <p className="text-slate-400 text-xs mt-3">
                                    Platform is auto-detected from campaign name (FB, TT, IG, GOOGLE, SNAP)
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
