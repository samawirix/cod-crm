'use client';

import React, { useState } from 'react';
import {
    Package, Search, MoreVertical, Eye, Truck,
    CheckCircle, XCircle, RotateCcw, Clock, DollarSign,
    ChevronLeft, ChevronRight, RefreshCw, Plus, User, Printer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
    useOrders,
    useOrderStats,
    useConfirmOrder,
    useShipOrder,
    useDeliverOrder,
    useReturnOrder,
    useCancelOrder,
    useBulkUpdateOrders,
    useBulkDeleteOrders
} from '@/hooks/useOrders';
import { useLeads } from '@/hooks/useLeads';
import { Order, Lead } from '@/lib/api';
import CreateOrderDialog from '@/components/CreateOrderDialog';
import Checkbox from '@/components/ui/checkbox';
import BulkActionsToolbar from '@/components/BulkActionsToolbar';
import { StatusBadge } from '@/components/ui/status-badge';
import { KPICard } from '@/components/ui/kpi-card';

const ORDER_STATUSES = [
    { value: 'all', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_STATUSES = [
    { value: 'all', label: 'All Payments' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'REFUNDED', label: 'Refunded' },
];

export default function OrdersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Dialogs
    const [shipDialog, setShipDialog] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
    const [returnDialog, setReturnDialog] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
    const [cancelDialog, setCancelDialog] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
    const [selectLeadDialog, setSelectLeadDialog] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [createOrderOpen, setCreateOrderOpen] = useState(false);

    // Form states
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCompany, setShippingCompany] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    // Queries
    const { data: ordersData, isLoading, refetch } = useOrders({
        page,
        per_page: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const { data: stats } = useOrderStats();

    // Get confirmed leads for order creation
    const { data: leadsData } = useLeads({ page: 1, page_size: 50 });
    const confirmedLeads = (leadsData?.leads || []).filter((lead: Lead) =>
        lead.status === 'CONFIRMED' || lead.status === 'QUALIFIED'
    );

    // Mutations
    const confirmOrder = useConfirmOrder();
    const shipOrder = useShipOrder();
    const deliverOrder = useDeliverOrder();
    const returnOrder = useReturnOrder();
    const cancelOrder = useCancelOrder();
    const bulkUpdate = useBulkUpdateOrders();
    const bulkDelete = useBulkDeleteOrders();

    const handleConfirm = async (orderId: number) => {
        try {
            await confirmOrder.mutateAsync({ orderId, data: { confirmed_by: 'Admin' } });
        } catch (error) {
            console.error('Failed to confirm order:', error);
        }
    };

    const handleShip = async () => {
        if (!shipDialog.order || !trackingNumber || !shippingCompany) return;
        try {
            await shipOrder.mutateAsync({
                orderId: shipDialog.order.id,
                data: { tracking_number: trackingNumber, delivery_partner: shippingCompany }
            });
            setShipDialog({ open: false, order: null });
            setTrackingNumber('');
            setShippingCompany('');
        } catch (error) {
            console.error('Failed to ship order:', error);
        }
    };

    const handleDeliver = async (orderId: number) => {
        try {
            await deliverOrder.mutateAsync({
                orderId,
                data: { success: true }
            });
        } catch (error) {
            console.error('Failed to deliver order:', error);
        }
    };

    const handleReturn = async () => {
        if (!returnDialog.order || !returnReason) return;
        try {
            await returnOrder.mutateAsync({
                orderId: returnDialog.order.id,
                data: { return_reason: returnReason }
            });
            setReturnDialog({ open: false, order: null });
            setReturnReason('');
        } catch (error) {
            console.error('Failed to return order:', error);
        }
    };

    const handleCancel = async () => {
        if (!cancelDialog.order || !cancelReason) return;
        try {
            await cancelOrder.mutateAsync({
                orderId: cancelDialog.order.id,
                reason: cancelReason
            });
            setCancelDialog({ open: false, order: null });
            setCancelReason('');
        } catch (error) {
            console.error('Failed to cancel order:', error);
        }
    };

    const orders = ordersData?.orders || [];
    const totalOrders = ordersData?.total || 0;
    const perPage = ordersData?.per_page || 20;
    const totalPages = Math.ceil(totalOrders / perPage);

    // Stats with fallback
    const orderStats = stats || {
        total_orders: 0,
        by_status: { pending: 0, confirmed: 0, shipped: 0, delivered: 0, returned: 0, cancelled: 0, failed: 0 },
        rates: { delivery_rate: 0, return_rate: 0, cancellation_rate: 0 },
        revenue: { total_revenue: 0, collected_amount: 0, pending_collection: 0 }
    };

    // Selection helpers
    const isAllSelected = orders.length > 0 && selectedIds.length === orders.length;
    const isPartialSelected = selectedIds.length > 0 && selectedIds.length < orders.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orders.map((o: Order) => o.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkStatusChange = async (status: string) => {
        await bulkUpdate.mutateAsync({ ids: selectedIds, status });
        setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
        await bulkDelete.mutateAsync(selectedIds);
        setSelectedIds([]);
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Package className="h-7 w-7 text-indigo-500" />
                        Order Management
                    </h1>
                    <p className="text-slate-400">Track and manage all orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => setSelectLeadDialog(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard
                    title="Total Orders"
                    value={orderStats.total_orders}
                    icon={Package}
                    variant="blue"
                />
                <KPICard
                    title="Pending"
                    value={orderStats.by_status.pending}
                    icon={Clock}
                    variant="yellow"
                />
                <KPICard
                    title="Shipped"
                    value={orderStats.by_status.shipped}
                    icon={Truck}
                    variant="purple"
                />
                <KPICard
                    title="Delivered"
                    value={orderStats.by_status.delivered}
                    subtitle={`${orderStats.rates.delivery_rate}% rate`}
                    icon={CheckCircle}
                    variant="emerald"
                    trend={{ value: orderStats.rates.delivery_rate, label: 'rate', positive: true }}
                />
                <KPICard
                    title="Returned"
                    value={orderStats.by_status.returned}
                    subtitle={`${orderStats.rates.return_rate}% rate`}
                    icon={RotateCcw}
                    variant="red"
                    trend={{ value: orderStats.rates.return_rate, label: 'rate', positive: false }}
                />
                <KPICard
                    title="Revenue"
                    value={`${orderStats.revenue.total_revenue.toLocaleString()} MAD`}
                    subtitle={`${orderStats.revenue.collected_amount.toLocaleString()} collected`}
                    icon={DollarSign}
                    variant="default"
                />
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search orders, customers, tracking..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-950/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-slate-950/50 border-slate-700/50 text-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                            {ORDER_STATUSES.map(status => (
                                <SelectItem key={status.value} value={status.value} className="text-slate-200 focus:bg-slate-800 cursor-pointer">
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-[180px] bg-slate-950/50 border-slate-700/50 text-white">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                            {PAYMENT_STATUSES.map(status => (
                                <SelectItem key={status.value} value={status.value} className="text-slate-200 focus:bg-slate-800 cursor-pointer">
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-sm border-b border-slate-800 bg-slate-950/30">
                                <th className="p-4 w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        indeterminate={isPartialSelected}
                                    />
                                </th>
                                <th className="p-4 font-medium">Order #</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Product</th>
                                <th className="p-4 font-medium">Total</th>
                                <th className="p-4 font-medium">Courier</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Payment</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-slate-500">
                                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-indigo-500" />
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-slate-500">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: Order) => (
                                    <tr
                                        key={order.id}
                                        className={`group transition-colors hover:bg-slate-800/50 ${selectedIds.includes(order.id) ? 'bg-indigo-900/10' : ''}`}
                                    >
                                        <td className="p-4 w-12">
                                            <Checkbox
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                                {order.order_number}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium text-slate-200">{order.customer_name}</p>
                                                <p className="text-xs text-slate-500">{order.customer_phone}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-slate-300">{order.product_name}</p>
                                                <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-emerald-400">
                                                {order.total_amount.toLocaleString()} MAD
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.courier || 'AMANA'} />
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.payment_status} />
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-700">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                                    <DropdownMenuItem className="text-slate-200 hover:bg-slate-800 cursor-pointer">
                                                        <Eye className="h-4 w-4 mr-2 text-slate-400" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-slate-200 hover:bg-slate-800 cursor-pointer"
                                                        onClick={() => window.open(`http://localhost:8000/api/v1/orders/${order.id}/label`, '_blank')}
                                                    >
                                                        <Printer className="h-4 w-4 mr-2 text-slate-400" />
                                                        Print Label
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-slate-800" />

                                                    {order.status === 'PENDING' && (
                                                        <DropdownMenuItem
                                                            className="text-indigo-400 hover:bg-slate-800 cursor-pointer"
                                                            onClick={() => handleConfirm(order.id)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Confirm Order
                                                        </DropdownMenuItem>
                                                    )}

                                                    {order.status === 'CONFIRMED' && (
                                                        <DropdownMenuItem
                                                            className="text-purple-400 hover:bg-slate-800 cursor-pointer"
                                                            onClick={() => setShipDialog({ open: true, order })}
                                                        >
                                                            <Truck className="h-4 w-4 mr-2" />
                                                            Ship Order
                                                        </DropdownMenuItem>
                                                    )}

                                                    {['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                                                        <DropdownMenuItem
                                                            className="text-emerald-400 hover:bg-slate-800 cursor-pointer"
                                                            onClick={() => handleDeliver(order.id)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Mark Delivered
                                                        </DropdownMenuItem>
                                                    )}

                                                    {order.status === 'DELIVERED' && (
                                                        <DropdownMenuItem
                                                            className="text-amber-400 hover:bg-slate-800 cursor-pointer"
                                                            onClick={() => setReturnDialog({ open: true, order })}
                                                        >
                                                            <RotateCcw className="h-4 w-4 mr-2" />
                                                            Mark Returned
                                                        </DropdownMenuItem>
                                                    )}

                                                    {!['DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status) && (
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:bg-slate-800 cursor-pointer"
                                                            onClick={() => setCancelDialog({ open: true, order })}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                            Cancel Order
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/30">
                        <p className="text-sm text-slate-500">
                            Page {page} of {totalPages} ({totalOrders} orders)
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Ship Order Dialog */}
            <Dialog open={shipDialog.open} onOpenChange={(open) => setShipDialog({ open, order: open ? shipDialog.order : null })}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Ship Order {shipDialog.order?.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400">Tracking Number</Label>
                            <Input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                                className="bg-slate-950/50 border-slate-700/50 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400">Shipping Company</Label>
                            <Select value={shippingCompany} onValueChange={setShippingCompany}>
                                <SelectTrigger className="bg-slate-950/50 border-slate-700/50 text-white">
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="Amana Express" className="text-slate-200 focus:bg-slate-800">Amana Express</SelectItem>
                                    <SelectItem value="CTM" className="text-slate-200 focus:bg-slate-800">CTM</SelectItem>
                                    <SelectItem value="Chrono Diali" className="text-slate-200 focus:bg-slate-800">Chrono Diali</SelectItem>
                                    <SelectItem value="Aramex" className="text-slate-200 focus:bg-slate-800">Aramex</SelectItem>
                                    <SelectItem value="DHL" className="text-slate-200 focus:bg-slate-800">DHL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShipDialog({ open: false, order: null })} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={handleShip}
                            disabled={!trackingNumber || !shippingCompany}
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            Ship Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Order Dialog */}
            <Dialog open={returnDialog.open} onOpenChange={(open) => setReturnDialog({ open, order: open ? returnDialog.order : null })}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Return Order {returnDialog.order?.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-slate-400 mb-2 block">Return Reason</Label>
                        <Textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Enter return reason..."
                            className="bg-slate-950/50 border-slate-700/50 text-white min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReturnDialog({ open: false, order: null })} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleReturn}
                            disabled={!returnReason}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Mark Returned
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, order: open ? cancelDialog.order : null })}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Cancel Order {cancelDialog.order?.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-slate-400 mb-2 block">Cancellation Reason</Label>
                        <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter cancellation reason..."
                            className="bg-slate-950/50 border-slate-700/50 text-white min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCancelDialog({ open: false, order: null })} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Keep Order
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={!cancelReason}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lead Selection Dialog */}
            <Dialog open={selectLeadDialog} onOpenChange={setSelectLeadDialog}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-400" />
                            Select Lead for Order
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {confirmedLeads.length === 0 ? (
                            <p className="text-slate-400 text-center py-8 bg-slate-950/30 rounded-lg border border-slate-800/50">
                                No qualified or confirmed leads available.
                                <br />
                                <span className="text-sm text-slate-500 mt-2 block">Convert a lead to &quot;Confirmed&quot; or &quot;Qualified&quot; status first.</span>
                            </p>
                        ) : (
                            confirmedLeads.map((lead: Lead) => (
                                <div
                                    key={lead.id}
                                    className="p-4 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:bg-slate-800 hover:border-indigo-500/30 cursor-pointer transition-all duration-200 group"
                                    onClick={() => {
                                        setSelectedLead(lead);
                                        setSelectLeadDialog(false);
                                        setCreateOrderOpen(true);
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">{lead.first_name} {lead.last_name}</p>
                                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                                {lead.phone} <span className="text-slate-600">•</span> {lead.city || 'No city'}
                                            </p>
                                        </div>
                                        <StatusBadge status={lead.status} />
                                    </div>
                                    {lead.product_interest && (
                                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                                            {lead.product_interest}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Order Dialog */}
            {selectedLead && (
                <CreateOrderDialog
                    open={createOrderOpen}
                    onOpenChange={setCreateOrderOpen}
                    leadId={selectedLead.id}
                    leadName={`${selectedLead.first_name} ${selectedLead.last_name || ''}`}
                    leadPhone={selectedLead.phone}
                    leadAddress={selectedLead.address}
                    leadCity={selectedLead.city}
                    onSuccess={() => {
                        setSelectedLead(null);
                        refetch();
                    }}
                />
            )}

            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                onBulkOrderStatus={handleBulkStatusChange}
                onBulkDelete={handleBulkDelete}
                entityType="orders"
                isLoading={bulkUpdate.isPending || bulkDelete.isPending}
            />
        </div>
    );
}
