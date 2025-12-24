'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Phone, PhoneOff, Clock, CheckCircle, XCircle, Calendar,
    MessageSquare, User, MapPin, Package, Truck, RefreshCw,
    Volume2, VolumeX, ChevronDown, ChevronUp, Plus, Minus,
    AlertTriangle, Ban, DollarSign, ShoppingBag, Repeat,
    Send, MessageCircle, Navigation, X, Check, Flame,
    PhoneCall, PhoneMissed, ArrowRight
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Lead {
    id: number;
    name: string;
    phone: string;
    city?: string;
    address?: string;
    product_interest?: string;
    source?: string;
    status: string;
    call_count: number;
    callback_date?: string;
    callback_time?: string;  // ISO datetime for scheduled callback
    callback_notes?: string;  // Notes for callback
    notes?: string;
    trust?: string;
    trust_label?: string;
    delivered_orders?: number;
    returned_orders?: number;
}

interface ProductVariant {
    id: number;
    product_id: number;
    variant_name: string;
    sku: string;
    color?: string;
    size?: string;
    capacity?: string;
    image_url?: string;
    price_override?: number;
    cost_override?: number;
    stock_quantity: number;
    is_active: boolean;
    is_low_stock: boolean;
    is_in_stock: boolean;
}

interface Product {
    id: number;
    name: string;
    selling_price: number;
    cost_price?: number;
    stock_quantity: number;
    variants?: { [key: string]: string[] };  // JSON variants column
    has_variants?: boolean;  // JSON variants flag
    image_url?: string;
    product_variants?: ProductVariant[];  // Database ProductVariant records
}

interface OrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variants?: { [key: string]: string };
}

interface Courier {
    id: number;
    name: string;
    code: string;
    base_rate: number;
}

// ═══════════════════════════════════════════════════════════════
// MOROCCAN CITIES DATA
// ═══════════════════════════════════════════════════════════════
const MOROCCAN_CITIES = [
    { name: 'Casablanca', zones: ['Maarif', 'Ain Diab', 'Sidi Bernoussi', 'Hay Hassani', 'Ain Chock', 'Anfa'], shipping: 0 },
    { name: 'Rabat', zones: ['Agdal', 'Hassan', 'Souissi', 'Hay Riad', 'Yacoub El Mansour'], shipping: 25 },
    { name: 'Salé', zones: ['Sala Al Jadida', 'Tabriquet', 'Bettana', 'Hay Salam'], shipping: 25 },
    { name: 'Marrakech', zones: ['Gueliz', 'Medina', 'Hivernage', 'Palmeraie'], shipping: 35 },
    { name: 'Fès', zones: ['Ville Nouvelle', 'Medina', 'Saiss'], shipping: 35 },
    { name: 'Tanger', zones: ['Centre Ville', 'Malabata', 'Boukhalef'], shipping: 35 },
    { name: 'Agadir', zones: ['Centre', 'Talborjt', 'Hay Mohammadi'], shipping: 40 },
    { name: 'Meknès', zones: ['Hamria', 'Ville Nouvelle'], shipping: 35 },
    { name: 'Oujda', zones: ['Centre', 'Lazaret'], shipping: 45 },
    { name: 'Kenitra', zones: ['Centre', 'Bir Rami'], shipping: 30 },
    { name: 'Tétouan', zones: ['Centre', 'Martil'], shipping: 35 },
    { name: 'Other', zones: [], shipping: 45 },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CallCenterPage() {
    const queryClient = useQueryClient();

    // View State
    const [activeTab, setActiveTab] = useState<'focus' | 'history' | 'callbacks'>('focus');
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [callStartTime, setCallStartTime] = useState<Date | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Order Builder State
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
    const [quantity, setQuantity] = useState(1);

    // Logistics State
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [selectedCourier, setSelectedCourier] = useState('AMANA');
    const [isExchange, setIsExchange] = useState(false);

    // UI State
    const [callNotes, setCallNotes] = useState('');
    const [showCallbackPicker, setShowCallbackPicker] = useState(false);
    const [callbackDateTime, setCallbackDateTime] = useState('');
    const [showCancelReasons, setShowCancelReasons] = useState(false);

    // Callback Scheduling Modal State
    const [showCallbackModal, setShowCallbackModal] = useState(false);
    const [callbackDate, setCallbackDate] = useState('');
    const [callbackTime, setCallbackTime] = useState('');
    const [callbackNotes, setCallbackNotes] = useState('');
    const [selectedLeadForCallback, setSelectedLeadForCallback] = useState<Lead | null>(null);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeLead && callStartTime) {
            interval = setInterval(() => {
                setCallDuration(Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeLead, callStartTime]);

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ═══════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════

    // Stats
    const { data: statsData } = useQuery({
        queryKey: ['call-stats'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/calls/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        },
        refetchInterval: 30000,
    });

    // Focus Queue
    const { data: focusQueue, refetch: refetchQueue } = useQuery({
        queryKey: ['focus-queue'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/calls/focus-queue?limit=30`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        },
        refetchInterval: 30000,
    });

    // Products with variants
    const { data: productsData } = useQuery({
        queryKey: ['products-with-variants'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');

            // Fetch products
            const res = await fetch(`${API_BASE_URL}/api/v1/products/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const productsList = data.products || data;

            // Fetch variants for each product
            const productsWithVariants = await Promise.all(
                productsList.map(async (product: Product) => {
                    try {
                        const variantRes = await fetch(
                            `${API_BASE_URL}/api/v1/products/${product.id}/variants`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const variants = await variantRes.json();
                        return {
                            ...product,
                            product_variants: Array.isArray(variants) ? variants : []
                        };
                    } catch {
                        return { ...product, product_variants: [] };
                    }
                })
            );

            return productsWithVariants;
        },
    });
    const products: Product[] = productsData || [];

    // Couriers
    const { data: couriersData } = useQuery({
        queryKey: ['couriers'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/couriers/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data.couriers || data;
        },
    });
    const couriers: Courier[] = couriersData || [];

    // Callbacks
    const { data: callbacksData } = useQuery({
        queryKey: ['callbacks'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/calls/callbacks?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        },
        enabled: activeTab === 'callbacks',
    });

    // ═══════════════════════════════════════════════════════════════
    // MUTATIONS
    // ═══════════════════════════════════════════════════════════════

    const saveCallMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/calls/log`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save call');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-stats'] });
            queryClient.invalidateQueries({ queryKey: ['focus-queue'] });
            queryClient.invalidateQueries({ queryKey: ['callbacks'] });
        },
    });

    const createOrderMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/orders/call-center`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create order');
            return res.json();
        },
    });

    // ═══════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════

    const startCall = (lead: Lead) => {
        setActiveLead(lead);
        setCallStartTime(new Date());
        setCallDuration(0);
        setOrderItems([]);
        setCallNotes('');
        setSelectedProduct(null);
        setSelectedVariants({});
        setQuantity(1);
        setIsExchange(false);

        // Pre-fill from lead data
        setSelectedCity(lead.city || '');
        setCustomerAddress(lead.address || '');

        // Pre-load product interest
        if (lead.product_interest) {
            const matchedProduct = products.find(p =>
                p.name.toLowerCase().includes(lead.product_interest!.toLowerCase()) ||
                lead.product_interest!.toLowerCase().includes(p.name.toLowerCase())
            );
            if (matchedProduct) {
                setSelectedProduct(matchedProduct);
            }
        }

        // Play sound
        if (soundEnabled) {
            // Audio notification could go here
        }
    };

    const endCall = () => {
        setActiveLead(null);
        setCallStartTime(null);
        setCallDuration(0);
        setOrderItems([]);
        setSelectedProduct(null);
        setSelectedVariants({});
        setShowCancelReasons(false);
    };

    // Product handling
    const handleProductSelect = (productId: number) => {
        const product = products.find(p => p.id === productId);
        setSelectedProduct(product || null);
        setSelectedVariants({});
        setQuantity(1);
    };

    const allVariantsSelected = () => {
        if (!selectedProduct?.variants) return true;
        return Object.keys(selectedProduct.variants).every(key => selectedVariants[key]);
    };

    const addToOrder = () => {
        if (!selectedProduct) return;
        if (selectedProduct.has_variants && !allVariantsSelected()) return;

        // Ensure price is a valid number
        const price = Number(selectedProduct.selling_price) || 0;

        const variantLabel = Object.values(selectedVariants).join(' / ');

        const newItem: OrderItem = {
            product_id: selectedProduct.id,
            product_name: variantLabel
                ? `${selectedProduct.name} (${variantLabel})`
                : selectedProduct.name,
            quantity,
            unit_price: price,
            total_price: price * quantity,
            selected_variants: selectedProduct.has_variants ? { ...selectedVariants } : undefined,
        };

        setOrderItems([...orderItems, newItem]);
        setSelectedProduct(null);
        setSelectedVariants({});
        setQuantity(1);
    };

    // Calculate totals - with null safety
    const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    const cityData = MOROCCAN_CITIES.find(c => c.name === selectedCity);
    const shippingCost = isExchange ? 0 : (cityData?.shipping ?? 45);
    const total = subtotal + shippingCost;
    const totalQuantity = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const isUpsell = totalQuantity > 1 || orderItems.length > 1;

    // Handle outcomes
    const handleOutcome = async (outcome: string, reason?: string) => {
        if (!activeLead) return;

        try {
            // Save call log
            await saveCallMutation.mutateAsync({
                lead_id: activeLead.id,
                outcome,
                duration: callDuration,
                notes: callNotes,
                callback_date: outcome === 'CALLBACK' ? callbackDateTime : null,
                cancellation_reason: reason || null,
            });

            // Create order if confirmed
            if (outcome === 'CONFIRMED' && orderItems.length > 0) {
                const orderData = {
                    lead_id: activeLead.id,
                    customer_name: activeLead.name,
                    customer_phone: activeLead.phone,
                    city: selectedCity,
                    zone: selectedZone,
                    address: customerAddress,
                    courier_code: selectedCourier,
                    is_exchange: isExchange,
                    is_upsell: isUpsell,
                    items: orderItems.map(item => ({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        selected_variants: item.selected_variants,
                    })),
                    subtotal,
                    shipping_cost: shippingCost,
                    total_amount: total,
                    notes: callNotes,
                };

                const result = await createOrderMutation.mutateAsync(orderData);
                alert(`✅ Order ${result.order_number || result.id} created successfully!`);
            } else if (outcome === 'CALLBACK') {
                alert('📅 Callback scheduled successfully!');
            } else if (outcome === 'NO_ANSWER') {
                alert('📞 Lead will be re-queued for later');
            } else if (outcome.startsWith('CANCELLED')) {
                alert('❌ Lead marked as cancelled');
            } else if (outcome === 'WRONG_NUMBER') {
                alert('🚫 Number blacklisted');
            }

            endCall();
            refetchQueue();

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error saving call outcome');
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // CALLBACK SCHEDULING
    // ═══════════════════════════════════════════════════════════════

    // Function to open callback scheduler
    const openCallbackScheduler = (lead: Lead) => {
        setSelectedLeadForCallback(lead);
        // Set default to tomorrow at 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCallbackDate(tomorrow.toISOString().split('T')[0]);
        setCallbackTime('10:00');
        setCallbackNotes('');
        setShowCallbackModal(true);
    };

    // Function to schedule callback
    const scheduleCallback = async () => {
        if (!selectedLeadForCallback || !callbackDate || !callbackTime) {
            alert('Please select date and time');
            return;
        }

        const callbackDateTime2 = new Date(`${callbackDate}T${callbackTime}`);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/api/v1/leads/${selectedLeadForCallback.id}/schedule-callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    callback_time: callbackDateTime2.toISOString(),
                    callback_notes: callbackNotes,
                    status: 'CALLBACK'
                })
            });

            if (response.ok) {
                alert(`✅ Callback scheduled for ${callbackDateTime2.toLocaleString()}`);
                setShowCallbackModal(false);
                queryClient.invalidateQueries({ queryKey: ['callbacks'] });
                queryClient.invalidateQueries({ queryKey: ['focus-queue'] });
            } else {
                alert('Failed to schedule callback');
            }
        } catch (error) {
            console.error('Error scheduling callback:', error);
            alert('Error scheduling callback');
        }
    };

    // Check if callback is overdue or upcoming
    const isCallbackOverdue = (lead: Lead) => {
        const callbackTime2 = lead.callback_time ? new Date(lead.callback_time) : null;
        return callbackTime2 && callbackTime2 < new Date();
    };

    const isCallbackUpcoming = (lead: Lead) => {
        const callbackTime2 = lead.callback_time ? new Date(lead.callback_time) : null;
        return callbackTime2 && callbackTime2 > new Date() &&
            (callbackTime2.getTime() - new Date().getTime()) < 30 * 60 * 1000; // Within 30 minutes
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '12px 20px',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0d1117',
            }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#e6edf3' }}>Call Center</h1>
                    <p style={{ fontSize: '12px', color: '#8b949e' }}>Manage calls and follow-ups</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                        { label: 'Calls', value: statsData?.total_calls || 0, color: '#58a6ff' },
                        { label: 'Answered', value: `${statsData?.answered || 0} (${statsData?.contact_rate || 0}%)`, color: '#3fb950' },
                        { label: 'Confirmed', value: statsData?.confirmed || 0, color: '#3fb950' },
                        { label: 'Callbacks', value: statsData?.callbacks_needed || 0, color: '#d29922' },
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                            <p style={{ fontSize: '10px', color: '#8b949e' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: soundEnabled ? '#238636' : '#21262d',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        Sound {soundEnabled ? 'On' : 'Off'}
                    </button>
                    <button
                        onClick={() => refetchQueue()}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#21262d',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            color: '#e6edf3',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* LEFT PANEL - Lead Queue (40%) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div style={{
                    width: activeLead ? '35%' : '100%',
                    borderRight: '1px solid #30363d',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                }}>
                    {/* Tabs */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #30363d', display: 'flex', gap: '8px' }}>
                        {[
                            { id: 'focus', label: 'Focus Mode', count: focusQueue?.leads?.length || 0, color: '#238636' },
                            { id: 'history', label: 'Call History', color: '#21262d' },
                            { id: 'callbacks', label: 'Callbacks', count: statsData?.callbacks_needed || 0, color: '#9e6a03' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: activeTab === tab.id ? tab.color : '#21262d',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span style={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Lead List */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                        {activeTab === 'focus' && (
                            <>
                                {(focusQueue?.leads || []).map((lead: Lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => !activeLead && startCall(lead)}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: activeLead?.id === lead.id ? '#1f6feb20' : '#161b22',
                                            border: `1px solid ${activeLead?.id === lead.id ? '#1f6feb' : '#30363d'}`,
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            cursor: activeLead ? 'default' : 'pointer',
                                            opacity: activeLead && activeLead.id !== lead.id ? 0.5 : 1,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>{lead.name}</p>
                                                <p style={{ fontSize: '12px', color: '#58a6ff' }}>{lead.phone}</p>
                                            </div>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: 500,
                                                backgroundColor: lead.trust === 'vip' ? 'rgba(63, 185, 80, 0.15)'
                                                    : lead.trust === 'high_risk' ? 'rgba(248, 81, 73, 0.15)'
                                                        : 'rgba(88, 166, 255, 0.15)',
                                                color: lead.trust === 'vip' ? '#3fb950'
                                                    : lead.trust === 'high_risk' ? '#f85149'
                                                        : '#58a6ff',
                                            }}>
                                                {lead.trust_label || 'New'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#8b949e' }}>
                                            {lead.product_interest && (
                                                <span style={{ color: '#a371f7' }}>📦 {lead.product_interest}</span>
                                            )}
                                            {lead.city && <span>📍 {lead.city}</span>}
                                            <span>📞 {lead.call_count} calls</span>
                                        </div>
                                        {!activeLead && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startCall(lead); }}
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '6px 16px',
                                                    backgroundColor: '#238636',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                <Phone size={14} /> Call
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}

                        {activeTab === 'callbacks' && (
                            <>
                                {(callbacksData?.callbacks || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                                        <Calendar size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                                        <p>No scheduled callbacks</p>
                                    </div>
                                ) : (
                                    (callbacksData?.callbacks || []).map((lead: Lead) => {
                                        const callbackTimeVal = lead.callback_time ? new Date(lead.callback_time) : null;
                                        const isPastDue = callbackTimeVal && callbackTimeVal < new Date();
                                        const isUpcoming = callbackTimeVal && callbackTimeVal > new Date() &&
                                            (callbackTimeVal.getTime() - new Date().getTime()) < 30 * 60 * 1000;
                                        const minutesOverdue = callbackTimeVal && isPastDue
                                            ? Math.round((new Date().getTime() - callbackTimeVal.getTime()) / 60000)
                                            : 0;

                                        return (
                                            <div key={lead.id} style={{
                                                padding: '12px',
                                                backgroundColor: isPastDue ? 'rgba(248, 81, 73, 0.05)' : isUpcoming ? 'rgba(210, 153, 34, 0.05)' : '#161b22',
                                                border: `1px solid ${isPastDue ? '#f85149' : isUpcoming ? '#d29922' : '#30363d'}`,
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                animation: isPastDue ? 'pulse 2s infinite' : 'none',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                                        {/* Status Indicator */}
                                                        <div style={{
                                                            width: '10px',
                                                            height: '10px',
                                                            borderRadius: '50%',
                                                            marginTop: '4px',
                                                            backgroundColor: isPastDue ? '#f85149' : isUpcoming ? '#d29922' : '#8b949e',
                                                        }} />

                                                        <div>
                                                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>{lead.name}</p>
                                                            <p style={{ fontSize: '12px', color: '#58a6ff' }}>{lead.phone}</p>

                                                            {/* Callback Time Display */}
                                                            {callbackTimeVal ? (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    marginTop: '4px',
                                                                    color: isPastDue ? '#f85149' : isUpcoming ? '#d29922' : '#8b949e',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <Clock size={12} />
                                                                    <span>
                                                                        {isPastDue ? '⚠️ OVERDUE: ' : ''}
                                                                        {callbackTimeVal.toLocaleString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                    {isPastDue && minutesOverdue > 0 && (
                                                                        <span style={{
                                                                            backgroundColor: 'rgba(248, 81, 73, 0.2)',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '10px',
                                                                        }}>
                                                                            {minutesOverdue} min ago
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p style={{ fontSize: '12px', color: '#f85149', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Calendar size={12} />
                                                                    Not scheduled
                                                                </p>
                                                            )}

                                                            {/* Callback Notes */}
                                                            {lead.callback_notes && (
                                                                <p style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                                                                    📝 {lead.callback_notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                    {/* Reschedule Button */}
                                                    <button
                                                        onClick={() => openCallbackScheduler(lead)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#21262d',
                                                            border: '1px solid #30363d',
                                                            borderRadius: '6px',
                                                            color: '#e6edf3',
                                                            fontSize: '11px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <Calendar size={12} /> Reschedule
                                                    </button>

                                                    {/* Call Now Button */}
                                                    <button
                                                        onClick={() => startCall(lead)}
                                                        disabled={!!activeLead}
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px 16px',
                                                            backgroundColor: isPastDue ? '#b62324' : '#9e6a03',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: activeLead ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <Phone size={14} />
                                                        {isPastDue ? 'Call NOW!' : 'Call Back'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* RIGHT PANEL - Active Call (65%) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeLead && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#0d1117',
                    }}>
                        {/* Call Header */}
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#161b22',
                            borderBottom: '1px solid #30363d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#238636',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Phone size={24} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3' }}>{activeLead.name}</p>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                        <span style={{ color: '#58a6ff' }}>{activeLead.phone}</span>
                                        <span style={{ color: '#8b949e' }}>Source: {activeLead.source}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timer & End Call */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#3fb950', fontFamily: 'monospace' }}>
                                        {formatDuration(callDuration)}
                                    </p>
                                    <p style={{ fontSize: '10px', color: '#8b949e' }}>Duration</p>
                                </div>
                                <button
                                    onClick={endCall}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: '#b62324',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <PhoneOff size={18} /> End
                                </button>
                            </div>
                        </div>

                        {/* WhatsApp Quick Actions */}
                        <div style={{
                            padding: '8px 16px',
                            backgroundColor: '#21262d',
                            display: 'flex',
                            gap: '8px',
                            borderBottom: '1px solid #30363d',
                        }}>
                            <span style={{ fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MessageCircle size={14} color="#25D366" /> WhatsApp:
                            </span>
                            {[
                                { label: '📞 No Answer', msg: `Salam ${activeLead.name.split(' ')[0]}, 3ayetna lik 3la 9bel l'commande...` },
                                { label: '📍 Location', msg: `Salam, momkin location dyalek bach livreur yjib lik talab?` },
                                { label: '✅ Confirm', msg: `Bghit n'akid m3ak talab ${activeLead.product_interest || ''}...` },
                            ].map((wa, idx) => (
                                <a
                                    key={idx}
                                    href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(wa.msg)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '4px 10px',
                                        backgroundColor: '#25D366',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '11px',
                                        textDecoration: 'none',
                                    }}
                                >
                                    {wa.label}
                                </a>
                            ))}
                        </div>

                        {/* Main Content - Two Columns */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            {/* Left: Notes (Compact) */}
                            <div style={{ width: '35%', padding: '12px', borderRight: '1px solid #30363d', overflow: 'auto' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '8px' }}>
                                    📝 CALL NOTES
                                </h4>
                                <textarea
                                    value={callNotes}
                                    onChange={(e) => setCallNotes(e.target.value)}
                                    placeholder="Quick notes..."
                                    style={{
                                        width: '100%',
                                        height: '80px',
                                        padding: '8px',
                                        backgroundColor: '#161b22',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#e6edf3',
                                        fontSize: '12px',
                                        resize: 'none',
                                    }}
                                />

                                {/* Lead Info */}
                                <div style={{ marginTop: '12px' }}>
                                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '8px' }}>
                                        👤 LEAD INFO
                                    </h4>
                                    <div style={{ fontSize: '12px', color: '#e6edf3' }}>
                                        <p>📍 {activeLead.city || 'No city'}</p>
                                        <p>📦 Interest: {activeLead.product_interest || 'None'}</p>
                                        <p>📞 Calls: {activeLead.call_count}</p>
                                        {activeLead.notes && <p>📝 {typeof activeLead.notes === 'string' ? activeLead.notes : (activeLead.notes.content || JSON.stringify(activeLead.notes))}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Order Builder (65%) */}
                            <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
                                {/* Upsell Badge */}
                                {isUpsell && (
                                    <div style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(255, 107, 0, 0.15)',
                                        border: '1px solid #ff6b00',
                                        borderRadius: '6px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}>
                                        <Flame size={16} color="#ff6b00" />
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#ff6b00' }}>
                                            🔥 UPSELL ACTIVE! ({totalQuantity} items)
                                        </span>
                                    </div>
                                )}

                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#e6edf3', marginBottom: '12px' }}>
                                    🛒 ORDER BUILDER
                                </h4>

                                {/* Product Selection - With Variants */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '12px' }}>
                                    <select
                                        value={selectedProduct?.id || ''}
                                        onChange={(e) => handleProductSelect(Number(e.target.value))}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: '#161b22',
                                            border: '1px solid #30363d',
                                            borderRadius: '6px',
                                            color: '#e6edf3',
                                            fontSize: '13px',
                                        }}
                                    >
                                        <option value="">Select product...</option>
                                        {products.map((p) => {
                                            // Products with variants - show as optgroup with variant options
                                            if (p.product_variants && p.product_variants.length > 0) {
                                                return (
                                                    <optgroup key={p.id} label={`📦 ${p.name}`}>
                                                        {p.product_variants.map(v => (
                                                            <option
                                                                key={`${p.id}-${v.id}`}
                                                                value={p.id}
                                                                data-variant-id={v.id}
                                                                disabled={!v.is_in_stock}
                                                            >
                                                                {v.variant_name} • {v.price_override || p.selling_price} MAD • {v.stock_quantity} in stock {!v.is_in_stock ? '❌' : ''}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                );
                                            }
                                            // Products without variants - show as single option
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - {p.selling_price} MAD {p.stock_quantity < 5 ? '⚠️' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            style={{ width: '32px', height: '36px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ width: '32px', textAlign: 'center', color: '#e6edf3', fontWeight: 600 }}>{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            style={{ width: '32px', height: '36px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Variants */}
                                {selectedProduct?.has_variants && selectedProduct.variants && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px',
                                        marginBottom: '12px',
                                        padding: '10px',
                                        backgroundColor: '#21262d',
                                        borderRadius: '6px',
                                    }}>
                                        {Object.entries(selectedProduct.variants).map(([type, options]) => (
                                            <select
                                                key={type}
                                                value={selectedVariants[type] || ''}
                                                onChange={(e) => setSelectedVariants({ ...selectedVariants, [type]: e.target.value })}
                                                style={{
                                                    padding: '8px',
                                                    backgroundColor: '#0d1117',
                                                    border: `1px solid ${selectedVariants[type] ? '#3fb950' : '#f85149'}`,
                                                    borderRadius: '4px',
                                                    color: '#e6edf3',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                <option value="">Select {type}...</option>
                                                {options.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ))}
                                    </div>
                                )}

                                {/* Add Button */}
                                <button
                                    onClick={addToOrder}
                                    disabled={!selectedProduct || (selectedProduct.has_variants && !allVariantsSelected())}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: (!selectedProduct || (selectedProduct.has_variants && !allVariantsSelected())) ? '#21262d' : '#238636',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: (!selectedProduct || (selectedProduct.has_variants && !allVariantsSelected())) ? 'not-allowed' : 'pointer',
                                        marginBottom: '12px',
                                    }}
                                >
                                    + Add to Order {selectedProduct && `(${((Number(selectedProduct.selling_price) || 0) * quantity).toFixed(0)} MAD)`}
                                </button>

                                {/* Visual Product Confirmation Card */}
                                {selectedProduct && (
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: 'rgba(31, 111, 235, 0.1)',
                                        border: '1px solid rgba(31, 111, 235, 0.3)',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                    }}>
                                        {/* Product Image */}
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '6px',
                                            backgroundColor: '#21262d',
                                            border: '1px solid #30363d',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                        }}>
                                            {selectedProduct.image_url ? (
                                                <img
                                                    src={selectedProduct.image_url}
                                                    alt={selectedProduct.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={24} color="#8b949e" />
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3', marginBottom: '4px' }}>
                                                {selectedProduct.name}
                                            </h4>

                                            {/* Selected Variants */}
                                            {Object.keys(selectedVariants).length > 0 && (
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                    {Object.entries(selectedVariants).map(([key, value]) => (
                                                        value && (
                                                            <span key={key} style={{
                                                                padding: '2px 8px',
                                                                backgroundColor: 'rgba(63, 185, 80, 0.15)',
                                                                border: '1px solid rgba(63, 185, 80, 0.3)',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                color: '#3fb950',
                                                            }}>
                                                                {key}: {value}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '18px', fontWeight: 700, color: '#3fb950' }}>
                                                    {((Number(selectedProduct.selling_price) || 0) * quantity).toFixed(0)} MAD
                                                </span>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                    backgroundColor: selectedProduct.stock_quantity > 10
                                                        ? 'rgba(63, 185, 80, 0.15)'
                                                        : selectedProduct.stock_quantity > 0
                                                            ? 'rgba(210, 153, 34, 0.15)'
                                                            : 'rgba(248, 81, 73, 0.15)',
                                                    color: selectedProduct.stock_quantity > 10
                                                        ? '#3fb950'
                                                        : selectedProduct.stock_quantity > 0
                                                            ? '#d29922'
                                                            : '#f85149',
                                                }}>
                                                    {selectedProduct.stock_quantity} in stock
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Items */}
                                {orderItems.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        {orderItems.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '8px',
                                                backgroundColor: '#161b22',
                                                borderRadius: '4px',
                                                marginBottom: '4px',
                                                fontSize: '12px',
                                            }}>
                                                <span style={{ color: '#e6edf3' }}>{item.product_name} ×{item.quantity}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#3fb950', fontWeight: 600 }}>{(Number(item.total_price) || 0).toFixed(0)} MAD</span>
                                                    <button
                                                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                                                        style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer' }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Logistics Section */}
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#161b22',
                                    borderRadius: '8px',
                                    marginBottom: '12px',
                                }}>
                                    <h5 style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', marginBottom: '10px' }}>
                                        🚚 DELIVERY INFO
                                    </h5>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                        {/* City */}
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => { setSelectedCity(e.target.value); setSelectedZone(''); }}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: '#0d1117',
                                                border: '1px solid #30363d',
                                                borderRadius: '4px',
                                                color: '#e6edf3',
                                                fontSize: '12px',
                                            }}
                                        >
                                            <option value="">Select City...</option>
                                            {MOROCCAN_CITIES.map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>

                                        {/* Zone */}
                                        <select
                                            value={selectedZone}
                                            onChange={(e) => setSelectedZone(e.target.value)}
                                            disabled={!selectedCity || (cityData?.zones.length === 0)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: '#0d1117',
                                                border: '1px solid #30363d',
                                                borderRadius: '4px',
                                                color: '#e6edf3',
                                                fontSize: '12px',
                                            }}
                                        >
                                            <option value="">Select Zone...</option>
                                            {(cityData?.zones || []).map((z: string) => (
                                                <option key={z} value={z}>{z}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Address */}
                                    <input
                                        type="text"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        placeholder="Full address..."
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            backgroundColor: '#0d1117',
                                            border: '1px solid #30363d',
                                            borderRadius: '4px',
                                            color: '#e6edf3',
                                            fontSize: '12px',
                                            marginBottom: '8px',
                                        }}
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {/* Courier */}
                                        <select
                                            value={selectedCourier}
                                            onChange={(e) => setSelectedCourier(e.target.value)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: '#0d1117',
                                                border: '1px solid #30363d',
                                                borderRadius: '4px',
                                                color: '#e6edf3',
                                                fontSize: '12px',
                                            }}
                                        >
                                            {couriers.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                            <option value="PRIVATE">Private Delivery</option>
                                        </select>

                                        {/* Exchange Checkbox */}
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px',
                                            backgroundColor: isExchange ? 'rgba(163, 113, 247, 0.15)' : '#0d1117',
                                            border: '1px solid #30363d',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={isExchange}
                                                onChange={(e) => setIsExchange(e.target.checked)}
                                            />
                                            <span style={{ fontSize: '11px', color: '#e6edf3' }}>
                                                <Repeat size={12} style={{ marginRight: '4px' }} />
                                                Exchange Order
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#238636',
                                    borderRadius: '8px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                        <span>Subtotal:</span>
                                        <span>{subtotal.toFixed(0)} MAD</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                        <span>Shipping {isExchange && '(Exchange)'}: </span>
                                        <span>{isExchange ? 'FREE' : `${shippingCost} MAD`}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: 'white', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
                                        <span>TOTAL:</span>
                                        <span>{total.toFixed(0)} MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* ACTION BAR */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div style={{
                            padding: '12px 16px',
                            borderTop: '1px solid #30363d',
                            backgroundColor: '#161b22',
                        }}>
                            {!showCancelReasons ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                    {/* ✅ Confirmed */}
                                    <button
                                        onClick={() => handleOutcome('CONFIRMED')}
                                        disabled={orderItems.length === 0}
                                        style={{
                                            padding: '12px 8px',
                                            backgroundColor: orderItems.length === 0 ? '#21262d' : '#238636',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: orderItems.length === 0 ? '#8b949e' : 'white',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: orderItems.length === 0 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <CheckCircle size={20} />
                                        Confirmed
                                    </button>

                                    {/* 📅 Callback */}
                                    <button
                                        onClick={() => setShowCallbackPicker(true)}
                                        style={{
                                            padding: '12px 8px',
                                            backgroundColor: '#9e6a03',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <Calendar size={20} />
                                        Callback
                                    </button>

                                    {/* 📞 No Answer */}
                                    <button
                                        onClick={() => handleOutcome('NO_ANSWER')}
                                        style={{
                                            padding: '12px 8px',
                                            backgroundColor: '#1f6feb',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <PhoneMissed size={20} />
                                        No Answer
                                    </button>

                                    {/* ❌ Cancel (Opens reasons) */}
                                    <button
                                        onClick={() => setShowCancelReasons(true)}
                                        style={{
                                            padding: '12px 8px',
                                            backgroundColor: '#b62324',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <XCircle size={20} />
                                        Cancel ▼
                                    </button>

                                    {/* 🚫 Wrong Number */}
                                    <button
                                        onClick={() => handleOutcome('WRONG_NUMBER')}
                                        style={{
                                            padding: '12px 8px',
                                            backgroundColor: '#21262d',
                                            border: '1px solid #30363d',
                                            borderRadius: '8px',
                                            color: '#f85149',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <Ban size={20} />
                                        Wrong #
                                    </button>

                                    {/* End Call */}
                                    <button
                                        onClick={endCall}
                                        style={{
                                            padding: '12px 8px',
                                            backgroundColor: '#161b22',
                                            border: '1px solid #30363d',
                                            borderRadius: '8px',
                                            color: '#8b949e',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <PhoneOff size={20} />
                                        Skip
                                    </button>
                                </div>
                            ) : (
                                /* Cancel Reasons Panel */
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', color: '#8b949e' }}>Select cancellation reason:</span>
                                        <button
                                            onClick={() => setShowCancelReasons(false)}
                                            style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                        {[
                                            { label: '💸 Price Too High', reason: 'PRICE', color: '#b62324' },
                                            { label: '📦 Out of Stock', reason: 'OOS', color: '#6e7681' },
                                            { label: '🤔 Changed Mind', reason: 'CHANGED_MIND', color: '#6e7681' },
                                            { label: '🏠 Delivery Issue', reason: 'DELIVERY', color: '#6e7681' },
                                            { label: '❓ Other', reason: 'OTHER', color: '#6e7681' },
                                        ].map(opt => (
                                            <button
                                                key={opt.reason}
                                                onClick={() => handleOutcome('CANCELLED', opt.reason)}
                                                style={{
                                                    padding: '10px 8px',
                                                    backgroundColor: opt.color,
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Callback Picker Modal */}
            {showCallbackPicker && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '400px',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e6edf3', marginBottom: '16px' }}>
                            📅 Schedule Callback
                        </h3>

                        <input
                            type="datetime-local"
                            value={callbackDateTime}
                            onChange={(e) => setCallbackDateTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#0d1117',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                color: '#e6edf3',
                                fontSize: '14px',
                                marginBottom: '16px',
                            }}
                        />

                        {/* Quick Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                            {[
                                { label: '1 Hour', hours: 1 },
                                { label: '2 Hours', hours: 2 },
                                { label: '4 Hours', hours: 4 },
                                { label: 'Tomorrow 10AM', value: 'tomorrow10' },
                                { label: 'Tomorrow 2PM', value: 'tomorrow14' },
                                { label: 'Tomorrow 6PM', value: 'tomorrow18' },
                            ].map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => {
                                        const now = new Date();
                                        let target: Date;
                                        if (opt.hours) {
                                            target = new Date(now.getTime() + opt.hours * 60 * 60 * 1000);
                                        } else {
                                            const hour = parseInt(opt.value!.replace('tomorrow', ''));
                                            target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, 0);
                                        }
                                        setCallbackDateTime(target.toISOString().slice(0, 16));
                                    }}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: '#21262d',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#e6edf3',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowCallbackPicker(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#e6edf3',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (callbackDateTime) {
                                        handleOutcome('CALLBACK');
                                        setShowCallbackPicker(false);
                                    }
                                }}
                                disabled={!callbackDateTime}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: callbackDateTime ? '#9e6a03' : '#21262d',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: callbackDateTime ? 'pointer' : 'not-allowed',
                                }}
                            >
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CALLBACK SCHEDULING MODAL */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {showCallbackModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: '#161b22',
                        borderRadius: '12px',
                        border: '1px solid #30363d',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '20px',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(210, 153, 34, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Calendar size={20} color="#d29922" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3', margin: 0 }}>Schedule Callback</h3>
                                    <p style={{ fontSize: '12px', color: '#8b949e', margin: 0 }}>{selectedLeadForCallback?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCallbackModal(false)}
                                style={{
                                    padding: '8px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                }}
                            >
                                <X size={20} color="#8b949e" />
                            </button>
                        </div>

                        {/* Quick Time Buttons */}
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>Quick Schedule:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {[
                                    { label: '30 min', minutes: 30 },
                                    { label: '1 hour', minutes: 60 },
                                    { label: '2 hours', minutes: 120 },
                                    { label: 'Tomorrow', minutes: 1440 },
                                ].map((option) => (
                                    <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => {
                                            const date = new Date();
                                            date.setMinutes(date.getMinutes() + option.minutes);
                                            setCallbackDate(date.toISOString().split('T')[0]);
                                            setCallbackTime(date.toTimeString().slice(0, 5));
                                        }}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: '#21262d',
                                            border: '1px solid #30363d',
                                            borderRadius: '6px',
                                            color: '#e6edf3',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
                                <Calendar size={14} /> Date
                            </label>
                            <input
                                type="date"
                                value={callbackDate}
                                onChange={(e) => setCallbackDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#e6edf3',
                                    fontSize: '14px',
                                }}
                            />
                        </div>

                        {/* Time Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
                                <Clock size={14} /> Time
                            </label>
                            <input
                                type="time"
                                value={callbackTime}
                                onChange={(e) => setCallbackTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#e6edf3',
                                    fontSize: '14px',
                                }}
                            />
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', display: 'block' }}>Notes (Optional)</label>
                            <textarea
                                value={callbackNotes}
                                onChange={(e) => setCallbackNotes(e.target.value)}
                                placeholder="Add notes for this callback..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#e6edf3',
                                    fontSize: '13px',
                                    resize: 'none',
                                }}
                            />
                        </div>

                        {/* Preview */}
                        {callbackDate && callbackTime && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '12px',
                                backgroundColor: 'rgba(210, 153, 34, 0.1)',
                                border: '1px solid rgba(210, 153, 34, 0.3)',
                                borderRadius: '8px',
                            }}>
                                <p style={{ fontSize: '13px', color: '#d29922' }}>
                                    📅 Callback scheduled for:{' '}
                                    <span style={{ fontWeight: 600 }}>
                                        {new Date(`${callbackDate}T${callbackTime}`).toLocaleString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowCallbackModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#e6edf3',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={scheduleCallback}
                                disabled={!callbackDate || !callbackTime}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: callbackDate && callbackTime ? '#9e6a03' : '#21262d',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: callbackDate && callbackTime ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                <Calendar size={16} /> Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
