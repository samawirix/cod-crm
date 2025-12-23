'use client';

import React, { useState } from 'react';
import { X, Trash2, UserPlus, RefreshCw, AlertTriangle, Check } from 'lucide-react';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface Agent {
    id: number;
    username: string;
    full_name?: string;
}

interface BulkActionsToolbarProps {
    selectedIds: number[];
    onClearSelection: () => void;
    // For Leads
    onBulkAssign?: (agentId: number) => Promise<void>;
    onBulkStatusChange?: (status: string) => Promise<void>;
    onBulkDelete?: () => Promise<void>;
    // For Orders
    onBulkOrderStatus?: (status: string) => Promise<void>;
    // Options
    agents?: Agent[];
    availableStatuses?: { value: string; label: string }[];
    entityType: 'leads' | 'orders';
    isLoading?: boolean;
}

// Status options for leads
const LEAD_STATUSES = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'WON', label: 'Won' },
    { value: 'LOST', label: 'Lost' },
    { value: 'NO_ANSWER', label: 'No Answer' },
    { value: 'BUSY', label: 'Busy' },
];

// Status options for orders
const ORDER_STATUSES = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function BulkActionsToolbar({
    selectedIds,
    onClearSelection,
    onBulkAssign,
    onBulkStatusChange,
    onBulkDelete,
    onBulkOrderStatus,
    agents = [],
    entityType,
    isLoading = false,
}: BulkActionsToolbarProps) {
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    const count = selectedIds.length;
    const statuses = entityType === 'leads' ? LEAD_STATUSES : ORDER_STATUSES;

    if (count === 0) return null;

    const handleBulkAction = async (action: () => Promise<void>) => {
        setLocalLoading(true);
        try {
            await action();
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Bar */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4">
                    {/* Selected Count */}
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                            {count} Selected
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelection}
                            className="text-slate-400 hover:text-white h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-slate-600" />

                    {/* Bulk Assign (Leads only) */}
                    {entityType === 'leads' && onBulkAssign && agents.length > 0 && (
                        <Select
                            onValueChange={(agentId) => handleBulkAction(() => onBulkAssign(parseInt(agentId)))}
                            disabled={localLoading || isLoading}
                        >
                            <SelectTrigger className="w-[160px] bg-slate-700 border-slate-600 text-white h-9">
                                <UserPlus className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {agents.map((agent) => (
                                    <SelectItem key={agent.id} value={agent.id.toString()}>
                                        {agent.full_name || agent.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Bulk Status Change */}
                    {(entityType === 'leads' ? onBulkStatusChange : onBulkOrderStatus) && (
                        <Select
                            onValueChange={(status) =>
                                handleBulkAction(() =>
                                    entityType === 'leads'
                                        ? onBulkStatusChange!(status)
                                        : onBulkOrderStatus!(status)
                                )
                            }
                            disabled={localLoading || isLoading}
                        >
                            <SelectTrigger className="w-[160px] bg-slate-700 border-slate-600 text-white h-9">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {statuses.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Bulk Delete */}
                    {onBulkDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteDialog(true)}
                            disabled={localLoading || isLoading}
                            className="border-red-600 text-red-400 hover:bg-red-600/20 hover:text-red-300 h-9"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}

                    {/* Loading indicator */}
                    {(localLoading || isLoading) && (
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Bulk Delete
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-white">
                            Are you sure you want to delete <strong>{count}</strong> {entityType}?
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            This action cannot be undone. All selected {entityType} will be permanently removed.
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog(false)}
                            className="border-slate-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                setDeleteDialog(false);
                                await handleBulkAction(() => onBulkDelete!());
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={localLoading}
                        >
                            {localLoading ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete {count} {entityType}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
