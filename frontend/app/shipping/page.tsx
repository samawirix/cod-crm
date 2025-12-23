'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Truck, Package, MapPin, Clock, CheckCircle, XCircle,
    RefreshCw, Search, Filter, Eye, Edit, MoreHorizontal,
    TrendingUp, AlertTriangle, DollarSign, Calendar,
    ArrowRight, ChevronDown, FileText, Plus
} from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const cardStyle: React.CSSProperties = {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
};

const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#e6edf3',
    fontSize: '14px',
    outline: 'none',
};

// ═══════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pending', color: '#d29922', bg: 'rgba(210, 153, 34, 0.15)' },
    PICKED_UP: { label: 'Picked Up', color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' },
    IN_TRANSIT: { label: 'In Transit', color: '#a371f7', bg: 'rgba(163, 113, 247, 0.15)' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' },
    DELIVERED: { label: 'Delivered', color: '#3fb950', bg: 'rgba(63, 185, 80, 0.15)' },
    FAILED_ATTEMPT: { label: 'Failed Attempt', color: '#f85149', bg: 'rgba(248, 81, 73, 0.15)' },
    RETURNED: { label: 'Returned', color: '#f85149', bg: 'rgba(248, 81, 73, 0.15)' },
    CANCELLED: { label: 'Cancelled', color: '#8b949e', bg: 'rgba(139, 148, 158, 0.15)' },
};

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface CourierStats {
    shipment_counts: {
        pending: number;
        picked_up: number;
        in_transit: number;
        out_for_delivery: number;
        delivered: number;
        returned: number;
        failed_attempts: number;
    };
    cod_amounts: {
        total: number;
        collected: number;
        pending: number;
    };
    active_couriers: number;
}

interface Shipment {
    id: number;
    tracking_number: string;
    order_id: number;
    courier_id: number;
    courier_name: string;
    customer_name: string;
    customer_phone: string;
    customer_city: string;
    customer_address: string;
    cod_amount: number;
    shipping_cost: number;
    collected_amount: number;
    status: string;
    status_notes: string;
    delivery_attempts: number;
    created_at: string;
    picked_up_at: string | null;
    delivered_at: string | null;
}

interface Courier {
    id: number;
    name: string;
    code: string;
    success_rate: number;
    total_shipments: number;
    base_rate: number;
    cod_fee_percent: number;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ShippingDashboard() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'couriers'>('overview');
    const [statusFilter, setStatusFilter] = useState('');
    const [courierFilter, setCourierFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');

    // Fetch stats
    const { data: stats } = useQuery<CourierStats>({
        queryKey: ['courier-stats'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/couriers/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        refetchInterval: 30000,
    });

    // Fetch shipments
    const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery<{ shipments: Shipment[]; total: number }>({
        queryKey: ['shipments', statusFilter, courierFilter, searchQuery],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (courierFilter) params.append('courier_id', courierFilter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', '100');

            const res = await fetch(`${API_BASE_URL}/api/v1/shipments/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return { shipments: [], total: 0 };
            return res.json();
        },
    });

    // Fetch couriers
    const { data: couriersData } = useQuery<{ couriers: Courier[] }>({
        queryKey: ['couriers'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/couriers/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return { couriers: [] };
            return res.json();
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ shipmentId, status, notes }: { shipmentId: number; status: string; notes: string }) => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/shipments/${shipmentId}/status`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notes }),
            });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
            setShowStatusModal(false);
            setSelectedShipment(null);
        },
    });

    const handleUpdateStatus = () => {
        if (!selectedShipment || !newStatus) return;
        updateStatusMutation.mutate({ shipmentId: selectedShipment.id, status: newStatus, notes: statusNotes });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatMoney = (amount: number) => `${(amount || 0).toLocaleString()} MAD`;

    return (
        <div style={{ minHeight: '100vh', padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Truck size={28} color="#58a6ff" />
                        Shipping & Delivery
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8b949e', marginTop: '4px' }}>Manage shipments, couriers, and deliveries</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['shipments'] })}
                        style={{ padding: '10px 16px', backgroundColor: '#30363d', border: 'none', borderRadius: '8px', color: '#e6edf3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <Link
                        href="/shipping/bordereau"
                        style={{ padding: '10px 16px', backgroundColor: '#238636', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                        <FileText size={16} /> Create Bordereau
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Pending', value: stats?.shipment_counts.pending || 0, color: '#d29922', icon: Clock },
                    { label: 'Picked Up', value: stats?.shipment_counts.picked_up || 0, color: '#58a6ff', icon: Package },
                    { label: 'In Transit', value: stats?.shipment_counts.in_transit || 0, color: '#a371f7', icon: Truck },
                    { label: 'Delivered', value: stats?.shipment_counts.delivered || 0, color: '#3fb950', icon: CheckCircle },
                    { label: 'Returned', value: stats?.shipment_counts.returned || 0, color: '#f85149', icon: XCircle },
                    { label: 'Failed', value: stats?.shipment_counts.failed_attempts || 0, color: '#f85149', icon: AlertTriangle },
                ].map((stat, i) => (
                    <div key={i} style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</p>
                                <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                            </div>
                            <stat.icon size={20} color={stat.color} style={{ opacity: 0.5 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* COD Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ ...cardStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <DollarSign size={20} color="#3fb950" />
                        <span style={{ fontSize: '13px', color: '#8b949e' }}>COD Collected</span>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#3fb950' }}>{formatMoney(stats?.cod_amounts.collected || 0)}</p>
                </div>
                <div style={{ ...cardStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Clock size={20} color="#d29922" />
                        <span style={{ fontSize: '13px', color: '#8b949e' }}>COD Pending</span>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#d29922' }}>{formatMoney(stats?.cod_amounts.pending || 0)}</p>
                </div>
                <div style={{ ...cardStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Truck size={20} color="#58a6ff" />
                        <span style={{ fontSize: '13px', color: '#8b949e' }}>Active Couriers</span>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#58a6ff' }}>{stats?.active_couriers || 0}</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[
                    { id: 'overview', label: 'All Shipments', icon: Package },
                    { id: 'couriers', label: 'Couriers', icon: Truck },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'couriers')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === tab.id ? '#238636' : '#30363d',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#e6edf3',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Shipments Tab */}
            {activeTab === 'overview' && (
                <div style={cardStyle}>
                    {/* Filters */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #30363d', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
                            <input
                                type="text"
                                placeholder="Search tracking #, customer name, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ ...inputStyle, width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: '160px' }}>
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                        <select value={courierFilter} onChange={(e) => setCourierFilter(e.target.value)} style={{ ...inputStyle, width: '160px' }}>
                            <option value="">All Couriers</option>
                            {couriersData?.couriers?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Table */}
                    <div style={{ overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0d1117' }}>
                                    {['Tracking #', 'Customer', 'City', 'Courier', 'COD', 'Status', 'Created', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', borderBottom: '1px solid #30363d' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shipmentsLoading ? (
                                    <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>Loading...</td></tr>
                                ) : !shipmentsData?.shipments?.length ? (
                                    <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>
                                        <Package size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                        <p>No shipments found</p>
                                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Create shipments from confirmed orders</p>
                                    </td></tr>
                                ) : (
                                    shipmentsData.shipments.map((shipment) => {
                                        const statusConfig = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.PENDING;
                                        return (
                                            <tr key={shipment.id} style={{ borderBottom: '1px solid #21262d' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#58a6ff' }}>{shipment.tracking_number}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#e6edf3' }}>{shipment.customer_name}</p>
                                                    <p style={{ fontSize: '11px', color: '#8b949e' }}>{shipment.customer_phone}</p>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#e6edf3' }}>{shipment.customer_city}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#a371f7' }}>{shipment.courier_name || '-'}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#3fb950' }}>{formatMoney(shipment.cod_amount)}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        backgroundColor: statusConfig.bg,
                                                        color: statusConfig.color,
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 500,
                                                    }}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '11px', color: '#8b949e' }}>{formatDate(shipment.created_at)}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedShipment(shipment);
                                                                setNewStatus(shipment.status);
                                                                setStatusNotes('');
                                                                setShowStatusModal(true);
                                                            }}
                                                            style={{ padding: '6px 10px', backgroundColor: '#30363d', border: 'none', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Edit size={12} /> Update
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Couriers Tab */}
            {activeTab === 'couriers' && (
                <div style={cardStyle}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #30363d' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3' }}>Courier Partners</h3>
                    </div>
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {couriersData?.couriers?.map(courier => (
                                <div key={courier.id} style={{ ...cardStyle, padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3' }}>{courier.name}</h4>
                                            <p style={{ fontSize: '12px', color: '#8b949e' }}>Code: {courier.code}</p>
                                        </div>
                                        <div style={{
                                            padding: '6px 12px',
                                            backgroundColor: courier.success_rate >= 75 ? 'rgba(63, 185, 80, 0.15)' : courier.success_rate > 0 ? 'rgba(248, 81, 73, 0.15)' : 'rgba(139, 148, 158, 0.15)',
                                            color: courier.success_rate >= 75 ? '#3fb950' : courier.success_rate > 0 ? '#f85149' : '#8b949e',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}>
                                            {courier.success_rate}% Success
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                                            <span>Total Shipments</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 500 }}>{courier.total_shipments}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                                            <span>Base Rate</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 500 }}>{courier.base_rate} MAD</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e' }}>
                                            <span>COD Fee</span>
                                            <span style={{ color: '#e6edf3', fontWeight: 500 }}>{courier.cod_fee_percent}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedShipment && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ ...cardStyle, padding: '24px', width: '450px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3', marginBottom: '8px' }}>Update Shipment Status</h3>
                        <p style={{ fontSize: '13px', color: '#8b949e', marginBottom: '20px' }}>
                            Tracking: <span style={{ color: '#58a6ff', fontFamily: 'monospace' }}>{selectedShipment.tracking_number}</span>
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>New Status</label>
                            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>Notes</label>
                            <textarea
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                placeholder="Add status notes..."
                                style={{ ...inputStyle, width: '100%', height: '80px', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowStatusModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#30363d', border: 'none', borderRadius: '8px', color: '#e6edf3', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending} style={{ flex: 1, padding: '12px', backgroundColor: '#238636', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
