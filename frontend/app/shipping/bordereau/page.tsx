'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Truck, Package, CheckCircle, ArrowLeft,
    Plus, Minus, Search, AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    city: string;
    total_amount: number;
    status: string;
}

interface Courier {
    id: number;
    name: string;
    code: string;
    base_rate: number;
}

export default function CreateBordereauPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedCourier, setSelectedCourier] = useState('');
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [notes, setNotes] = useState('');

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

    // Fetch confirmed orders without shipment
    const { data: ordersData, isLoading } = useQuery<{ orders: Order[] }>({
        queryKey: ['orders-for-shipping'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/orders/?status=CONFIRMED&limit=200`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return { orders: [] };
            return res.json();
        },
    });

    // Create shipments mutation
    const createShipmentsMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('access_token');

            // Create shipments for selected orders
            const res = await fetch(`${API_BASE_URL}/api/v1/shipments/bulk`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_ids: selectedOrders,
                    courier_id: parseInt(selectedCourier),
                }),
            });

            if (!res.ok) throw new Error('Failed to create shipments');
            return res.json();
        },
        onSuccess: (data) => {
            alert(`✅ Created ${data.created_count} shipments successfully!${data.error_count > 0 ? ` (${data.error_count} errors)` : ''}`);
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['orders-for-shipping'] });
            queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
            router.push('/shipping');
        },
        onError: (error) => {
            alert(`❌ Error: ${error.message}`);
        },
    });

    const toggleOrder = (orderId: number) => {
        setSelectedOrders(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const selectAll = () => {
        if (!ordersData?.orders) return;
        const filtered = filteredOrders.map(o => o.id);
        setSelectedOrders(filtered);
    };

    const deselectAll = () => setSelectedOrders([]);

    const filteredOrders = (ordersData?.orders || []).filter(o =>
        o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCOD = filteredOrders.filter(o => selectedOrders.includes(o.id)).reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return (
        <div style={{ minHeight: '100vh', padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Link href="/shipping" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b949e', textDecoration: 'none', marginBottom: '12px', fontSize: '13px' }}>
                    <ArrowLeft size={16} /> Back to Shipping
                </Link>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={28} color="#58a6ff" />
                    Create Shipments
                </h1>
                <p style={{ fontSize: '14px', color: '#8b949e', marginTop: '4px' }}>Select confirmed orders to create shipments with a courier</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                {/* Orders Selection */}
                <div style={cardStyle}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #30363d', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ ...inputStyle, width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                        <button onClick={selectAll} style={{ padding: '10px 16px', backgroundColor: '#238636', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
                            Select All
                        </button>
                        <button onClick={deselectAll} style={{ padding: '10px 16px', backgroundColor: '#30363d', border: 'none', borderRadius: '6px', color: '#e6edf3', fontSize: '13px', cursor: 'pointer' }}>
                            Clear
                        </button>
                    </div>

                    <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                        {isLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>Loading orders...</div>
                        ) : !filteredOrders.length ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>
                                <Package size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <p>No confirmed orders available for shipping</p>
                                <p style={{ fontSize: '12px', marginTop: '8px' }}>Confirm orders first to create shipments</p>
                            </div>
                        ) : (
                            filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => toggleOrder(order.id)}
                                    style={{
                                        padding: '14px 16px',
                                        borderBottom: '1px solid #21262d',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedOrders.includes(order.id) ? 'rgba(35, 134, 54, 0.1)' : 'transparent',
                                        transition: 'background-color 0.15s',
                                    }}
                                >
                                    <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '4px',
                                        border: selectedOrders.includes(order.id) ? '2px solid #238636' : '2px solid #30363d',
                                        backgroundColor: selectedOrders.includes(order.id) ? '#238636' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {selectedOrders.includes(order.id) && <CheckCircle size={14} color="white" />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e6edf3' }}>{order.order_number}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3fb950' }}>{(order.total_amount || 0).toLocaleString()} MAD</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8b949e' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer_name}</span>
                                            <span style={{ flexShrink: 0, marginLeft: '8px' }}>{order.city}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Summary Panel */}
                <div>
                    <div style={{ ...cardStyle, padding: '20px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3', marginBottom: '16px' }}>Shipment Summary</h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>Select Courier *</label>
                            <select value={selectedCourier} onChange={(e) => setSelectedCourier(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                                <option value="">Choose courier...</option>
                                {couriersData?.couriers?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.base_rate} MAD</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px' }}>Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes for shipping..."
                                style={{ ...inputStyle, width: '100%', height: '80px', resize: 'none' }}
                            />
                        </div>

                        <div style={{ padding: '16px', backgroundColor: '#0d1117', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                <span style={{ color: '#8b949e' }}>Selected Orders</span>
                                <span style={{ color: '#e6edf3', fontWeight: 600 }}>{selectedOrders.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #30363d' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>Total COD</span>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: '#3fb950' }}>{totalCOD.toLocaleString()} MAD</span>
                            </div>
                        </div>
                    </div>

                    {selectedOrders.length === 0 || !selectedCourier ? (
                        <div style={{ ...cardStyle, padding: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#d29922' }}>
                            <AlertTriangle size={18} />
                            <span style={{ fontSize: '13px' }}>Select orders and courier to continue</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => createShipmentsMutation.mutate()}
                            disabled={createShipmentsMutation.isPending}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#238636',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: createShipmentsMutation.isPending ? 0.7 : 1,
                            }}
                        >
                            <Truck size={18} />
                            {createShipmentsMutation.isPending ? 'Creating Shipments...' : `Create ${selectedOrders.length} Shipments`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
