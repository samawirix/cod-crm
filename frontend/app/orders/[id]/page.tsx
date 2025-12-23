'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package, ArrowLeft, Truck, CheckCircle, XCircle, RotateCcw,
    Clock, MapPin, Phone, Mail, User, DollarSign,
    FileText, History, Copy, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format, formatDistanceToNow } from 'date-fns';
import {
    useOrder,
    useOrderHistory,
    useConfirmOrder,
    useShipOrder,
    useDeliverOrder,
    useReturnOrder,
    useCancelOrder
} from '@/hooks/useOrders';

const getActionIcon = (action: string) => {
    const icons: Record<string, React.ElementType> = {
        'Order created': Package,
        'Order updated': Clock,
        'Order confirmed': CheckCircle,
        'Order shipped': Truck,
        'Order delivered': CheckCircle,
        'Order returned': RotateCcw,
        'Order cancelled': XCircle,
        'Out for delivery': Truck,
    };
    return icons[action] || History;
};

const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
        'Order created': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        'Order confirmed': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        'Order shipped': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        'Order delivered': 'text-green-400 bg-green-500/10 border-green-500/20',
        'Order returned': 'text-red-400 bg-red-500/10 border-red-500/20',
        'Order cancelled': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
        'Out for delivery': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        'Order updated': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    };
    return colors[action] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
};

// Status Pipeline Steps
const STATUS_PIPELINE = [
    { key: 'PENDING', label: 'Pending', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = Number(params.id);

    // Fetch order data
    const { data: order, isLoading, error } = useOrder(orderId);
    const { data: historyData } = useOrderHistory(orderId);

    // Dialogs
    const [shipDialog, setShipDialog] = useState(false);
    const [returnDialog, setReturnDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);

    // Form states
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCompany, setShippingCompany] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    // Mutations
    const confirmOrder = useConfirmOrder();
    const shipOrder = useShipOrder();
    const deliverOrder = useDeliverOrder();
    const returnOrder = useReturnOrder();
    const cancelOrder = useCancelOrder();

    const handleConfirm = async () => {
        try {
            await confirmOrder.mutateAsync({ orderId, data: { confirmed_by: 'Admin' } });
        } catch (error) {
            console.error('Failed to confirm order:', error);
        }
    };

    const handleShip = async () => {
        if (!trackingNumber || !shippingCompany) return;
        try {
            await shipOrder.mutateAsync({
                orderId,
                data: { tracking_number: trackingNumber, delivery_partner: shippingCompany }
            });
            setShipDialog(false);
            setTrackingNumber('');
            setShippingCompany('');
        } catch (error) {
            console.error('Failed to ship order:', error);
        }
    };

    const handleDeliver = async () => {
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
        if (!returnReason) return;
        try {
            await returnOrder.mutateAsync({
                orderId,
                data: { return_reason: returnReason }
            });
            setReturnDialog(false);
            setReturnReason('');
        } catch (error) {
            console.error('Failed to return order:', error);
        }
    };

    const handleCancel = async () => {
        if (!cancelReason) return;
        try {
            await cancelOrder.mutateAsync({
                orderId,
                reason: cancelReason
            });
            setCancelDialog(false);
            setCancelReason('');
        } catch (error) {
            console.error('Failed to cancel order:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Get current step index for pipeline
    const getCurrentStepIndex = () => {
        if (!order) return 0;
        if (order.status === 'RETURNED' || order.status === 'CANCELLED') return -1;
        const index = STATUS_PIPELINE.findIndex(s => s.key === order.status);
        return index >= 0 ? index : 0;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Package className="h-12 w-12 text-slate-400 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-400">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">Order not found</p>
                    <Button onClick={() => router.push('/orders')} className="bg-slate-700 hover:bg-slate-600">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const history = historyData || [];
    const currentStep = getCurrentStepIndex();
    const isCompleted = ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status);

    return (
        <div className="min-h-screen bg-slate-900 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/orders')}
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(order.order_number)}
                                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-slate-400">
                            Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} className="text-sm px-3 py-1" />
                    <StatusBadge status={order.payment_status} className="text-sm px-3 py-1" />
                </div>
            </div>

            {/* Status Pipeline */}
            {!isCompleted && currentStep >= 0 && (
                <div className="glass-card rounded-xl p-8 border border-slate-700/50">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line - Background */}
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-800 -z-0 rounded-full" />

                        {/* Connecting Line - Progress */}
                        <div
                            className="absolute left-0 top-1/2 h-1 bg-indigo-500 transition-all duration-500 rounded-full -z-0"
                            style={{ width: `${(currentStep / (STATUS_PIPELINE.length - 1)) * 100}%` }}
                        />

                        {STATUS_PIPELINE.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = index === currentStep;
                            const isComplete = index < currentStep;

                            return (
                                <div key={step.key} className="flex flex-col items-center relative z-10 group">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-4
                                        ${isComplete
                                            ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-900/20'
                                            : isActive
                                                ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10'
                                                : 'bg-slate-800 border-slate-700'
                                        }
                                    `}>
                                        <StepIcon className={`h-5 w-5 ${isComplete || isActive ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    <span className={`mt-3 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Returned/Cancelled Banner */}
            {order.status === 'RETURNED' && (
                <div className="glass-card bg-red-950/20 border-red-500/30 p-6 rounded-xl flex items-center gap-4">
                    <RotateCcw className="h-8 w-8 text-red-400" />
                    <div>
                        <p className="text-red-400 font-semibold text-lg">Order Returned</p>
                        <p className="text-red-300/80">{order.return_reason || 'No reason provided'}</p>
                    </div>
                </div>
            )}

            {order.status === 'CANCELLED' && (
                <div className="glass-card bg-slate-900/50 border-slate-700/50 p-6 rounded-xl flex items-center gap-4">
                    <XCircle className="h-8 w-8 text-slate-400" />
                    <div>
                        <p className="text-slate-400 font-semibold text-lg">Order Cancelled</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Shipping Info */}
                    <Card className="glass-card border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <User className="h-5 w-5 text-indigo-400" />
                                Customer & Shipping
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Customer Information</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{order.customer_name}</p>
                                                <p className="text-slate-500 text-sm">Customer</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-2">
                                            <Phone className="h-4 w-4 text-slate-500" />
                                            <span className="text-slate-300">{order.customer_phone}</span>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-white" onClick={() => copyToClipboard(order.customer_phone)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {order.customer_email && (
                                            <div className="flex items-center gap-3 pl-2">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                                <span className="text-slate-300">{order.customer_email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Shipping Address</h4>
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                            <MapPin className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div className="text-slate-300">
                                            <p className="text-white font-medium mb-1">Delivery Address</p>
                                            <p className="leading-relaxed">{order.delivery_address}</p>
                                            <p className="text-slate-500 font-medium mt-1">{order.city}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Details */}
                    <Card className="glass-card border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Package className="h-5 w-5 text-purple-400" />
                                Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800/50">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-md bg-slate-800 flex items-center justify-center border border-slate-700">
                                            <Package className="h-8 w-8 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-lg">{order.product_name}</p>
                                            <p className="text-slate-500 text-sm">SKU: {order.product_sku || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-medium text-lg">Qty: {order.quantity}</p>
                                        <p className="text-indigo-400 text-sm font-mono">{order.unit_price.toLocaleString()} MAD / unit</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                                <div className="flex justify-between text-slate-400 font-medium">
                                    <span>Subtotal</span>
                                    <span>{order.subtotal.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between text-slate-400 font-medium">
                                    <span>Delivery Charges</span>
                                    <span>{order.delivery_charges.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between items-center text-white font-bold text-xl pt-4 border-t border-slate-800 mt-4">
                                    <span>Total (COD)</span>
                                    <span className="text-emerald-400 drop-shadow-sm">{order.total_amount.toLocaleString()} MAD</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tracking Info */}
                    {order.tracking_number && (
                        <Card className="glass-card border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-orange-400" />
                                    Tracking Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Shipping Company</p>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={order.delivery_partner || 'Unknown'} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Tracking Number</p>
                                        <div className="flex items-center gap-2 bg-slate-950/30 px-3 py-1.5 rounded border border-slate-800/50 w-fit">
                                            <p className="text-white font-mono">{order.tracking_number}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-slate-500 hover:text-white"
                                                onClick={() => copyToClipboard(order.tracking_number!)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    {order.shipped_at && (
                                        <div>
                                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Shipped At</p>
                                            <p className="text-white font-medium">{format(new Date(order.shipped_at), 'MMM d, yyyy HH:mm')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Order History Timeline */}
                    <Card className="glass-card border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <History className="h-5 w-5 text-cyan-400" />
                                Order Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length === 0 ? (
                                <p className="text-slate-500 text-center py-8 italic">No history available</p>
                            ) : (
                                <div className="space-y-0 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-5 top-4 bottom-4 w-px bg-slate-800" />

                                    {history.map((entry: any, index: number) => {
                                        const ActionIcon = getActionIcon(entry.action);
                                        const colorClass = getActionColor(entry.action);

                                        return (
                                            <div key={entry.id || index} className="flex gap-4 relative pb-8 last:pb-0 group">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border z-10 transition-transform group-hover:scale-105 ${colorClass}`}>
                                                    <ActionIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                        <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">{entry.action}</p>
                                                        <span className="text-slate-500 text-xs font-mono">
                                                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    {entry.old_status && entry.new_status && (
                                                        <div className="inline-flex items-center gap-2 text-xs mb-2 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                                                            <span className="text-slate-400">{entry.old_status}</span>
                                                            <ArrowLeft className="h-3 w-3 rotate-180 text-slate-500" />
                                                            <span className="text-white">{entry.new_status}</span>
                                                        </div>
                                                    )}

                                                    {entry.notes && (
                                                        <p className="text-slate-400 text-sm bg-slate-900/30 p-3 rounded-lg border border-slate-800/50 italic">
                                                            &quot;{entry.notes}&quot;
                                                        </p>
                                                    )}

                                                    {entry.performed_by && (
                                                        <p className="text-slate-600 text-xs mt-2 flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {entry.performed_by}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="glass-card border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {order.status === 'PENDING' && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                                    onClick={handleConfirm}
                                    disabled={confirmOrder.isPending}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {confirmOrder.isPending ? 'Confirming...' : 'Confirm Order'}
                                </Button>
                            )}

                            {order.status === 'CONFIRMED' && (
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20"
                                    onClick={() => setShipDialog(true)}
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Ship Order
                                </Button>
                            )}

                            {['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
                                    onClick={handleDeliver}
                                    disabled={deliverOrder.isPending}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {deliverOrder.isPending ? 'Processing...' : 'Mark as Delivered'}
                                </Button>
                            )}

                            {order.status === 'DELIVERED' && (
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
                                    onClick={() => setReturnDialog(true)}
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Mark as Returned
                                </Button>
                            )}

                            {!['DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status) && (
                                <>
                                    <div className="border-t border-slate-800 pt-3 mt-3" />
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-900/30 text-red-400 bg-red-950/10 hover:bg-red-900/30 hover:text-red-300 hover:border-red-800 transition-colors"
                                        onClick={() => setCancelDialog(true)}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Order
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card className="glass-card border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-400" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-900/30 p-2 rounded">
                                <span className="text-slate-400 text-sm">Order ID</span>
                                <span className="text-white font-mono font-medium">#{order.id}</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-slate-400 text-sm">Lead Source</span>
                                <span className="text-white text-sm">#{order.lead_id}</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-slate-400 text-sm">Created Date</span>
                                <span className="text-white text-sm">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-slate-400 text-sm">Last Update</span>
                                <span className="text-white text-sm">{format(new Date(order.updated_at), 'MMM d, yyyy HH:mm')}</span>
                            </div>
                            {order.delivered_at && (
                                <div className="flex justify-between items-center p-2 bg-emerald-950/10 rounded border border-emerald-900/20">
                                    <span className="text-emerald-400/80 text-sm">Delivered On</span>
                                    <span className="text-emerald-400 text-sm font-medium">{format(new Date(order.delivered_at), 'MMM d, yyyy')}</span>
                                </div>
                            )}
                            {order.payment_collected && (
                                <div className="flex justify-between items-center pt-3 border-t border-slate-800 mt-2">
                                    <span className="text-slate-300">Cash Collected</span>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-emerald-400" />
                                        <span className="text-emerald-400 font-bold text-lg">{order.cash_collected?.toLocaleString() || order.total_amount.toLocaleString()} MAD</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {order.notes && (
                        <Card className="glass-card border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-yellow-400" />
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300 bg-yellow-950/10 p-4 rounded-lg border border-yellow-900/20 text-sm leading-relaxed">
                                    {order.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Ship Order Dialog */}
            <Dialog open={shipDialog} onOpenChange={setShipDialog}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ship Order {order.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tracking Number</Label>
                            <Input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                                className="bg-slate-950/50 border-slate-700/50 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Shipping Company</Label>
                            <Select value={shippingCompany} onValueChange={setShippingCompany}>
                                <SelectTrigger className="bg-slate-950/50 border-slate-700/50 text-white">
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="Amana Express" className="text-slate-200">Amana Express</SelectItem>
                                    <SelectItem value="CTM" className="text-slate-200">CTM</SelectItem>
                                    <SelectItem value="Chrono Diali" className="text-slate-200">Chrono Diali</SelectItem>
                                    <SelectItem value="Aramex" className="text-slate-200">Aramex</SelectItem>
                                    <SelectItem value="DHL" className="text-slate-200">DHL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShipDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={handleShip}
                            disabled={!trackingNumber || !shippingCompany || shipOrder.isPending}
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            {shipOrder.isPending ? 'Shipping...' : 'Ship Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Order Dialog */}
            <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Return Order {order.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-slate-300 mb-2 block">Return Reason</Label>
                        <Textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Enter return reason..."
                            className="bg-slate-950/50 border-slate-700/50 text-white min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReturnDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleReturn}
                            disabled={!returnReason || returnOrder.isPending}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {returnOrder.isPending ? 'Processing...' : 'Mark Returned'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
                <DialogContent className="glass-card bg-slate-900/95 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Cancel Order {order.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-slate-300 mb-2 block">Cancellation Reason</Label>
                        <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter cancellation reason..."
                            className="bg-slate-950/50 border-slate-700/50 text-white min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCancelDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Keep Order</Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={!cancelReason || cancelOrder.isPending}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
