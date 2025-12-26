'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Components
import GlobalKpiHeader from './components/GlobalKpiHeader';
import LeadQueue from './components/LeadQueue';
import ActiveCallPanel from './components/ActiveCallPanel';
import OrderBuilder from './components/OrderBuilder';
import ActionBar from './components/ActionBar';
import CallbackModal from './components/CallbackModal';

// Types and Data
import { Lead, Product, ProductVariant, OrderItem, Courier, MOROCCAN_CITIES } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

    // Logistics State
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedZone, setSelectedZone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [selectedCourier, setSelectedCourier] = useState('AMANA');
    const [isExchange, setIsExchange] = useState(false);

    // UI State
    const [callNotes, setCallNotes] = useState('');
    const [showCallbackPicker, setShowCallbackPicker] = useState(false);
    const [showCallbackModal, setShowCallbackModal] = useState(false);
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

    // ═══════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════

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

    const { data: productsData } = useQuery({
        queryKey: ['products-with-variants'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/v1/products/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const productsList = data.products || data;

            const productsWithVariants = await Promise.all(
                productsList.map(async (product: Product) => {
                    try {
                        const variantRes = await fetch(
                            `${API_BASE_URL}/api/v1/products/${product.id}/variants`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const variants = await variantRes.json();
                        return { ...product, product_variants: Array.isArray(variants) ? variants : [] };
                    } catch {
                        return { ...product, product_variants: [] };
                    }
                })
            );
            return productsWithVariants;
        },
    });
    const products: Product[] = productsData || [];

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
        setIsExchange(false);
        setSelectedCity(lead.city || '');
        setCustomerAddress(lead.address || '');
        if (soundEnabled) { /* Audio notification */ }
    };

    const endCall = () => {
        setActiveLead(null);
        setCallStartTime(null);
        setCallDuration(0);
        setOrderItems([]);
    };

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    const cityData = MOROCCAN_CITIES.find(c => c.name === selectedCity);
    const shippingCost = isExchange ? 0 : (cityData?.shipping ?? 45);
    const total = subtotal + shippingCost;
    const isUpsell = orderItems.length > 1 || orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) > 1;

    // Handle outcomes
    const handleOutcome = async (outcome: string, reason?: string) => {
        if (!activeLead) return;

        try {
            await saveCallMutation.mutateAsync({
                lead_id: activeLead.id,
                outcome,
                duration: callDuration,
                notes: callNotes,
                callback_date: outcome === 'CALLBACK' ? null : null,
                cancellation_reason: reason || null,
            });

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

    // Callback scheduling
    const openCallbackScheduler = (lead: Lead) => {
        setSelectedLeadForCallback(lead);
        setShowCallbackModal(true);
    };

    const handleCallbackSchedule = async (dateTime: string) => {
        if (showCallbackPicker) {
            // In-call callback
            handleOutcome('CALLBACK');
            setShowCallbackPicker(false);
        } else if (selectedLeadForCallback) {
            // Queue callback scheduling
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE_URL}/api/v1/leads/${selectedLeadForCallback.id}/schedule-callback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        callback_time: new Date(dateTime).toISOString(),
                        status: 'CALLBACK'
                    })
                });
                if (response.ok) {
                    alert(`✅ Callback scheduled`);
                    setShowCallbackModal(false);
                    queryClient.invalidateQueries({ queryKey: ['callbacks'] });
                    queryClient.invalidateQueries({ queryKey: ['focus-queue'] });
                }
            } catch (error) {
                console.error('Error scheduling callback:', error);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#0d1117]">
            {/* Header */}
            <GlobalKpiHeader
                statsData={statsData}
                user={{ name: 'Admin User', initials: 'AU' }}
                soundEnabled={soundEnabled}
                onSoundToggle={() => setSoundEnabled(!soundEnabled)}
                onRefresh={() => refetchQueue()}
                isRefreshing={false}
            />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Lead Queue */}
                <LeadQueue
                    focusLeads={focusQueue?.leads || []}
                    callbackLeads={callbacksData?.callbacks || []}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    activeLead={activeLead}
                    onStartCall={startCall}
                    onReschedule={openCallbackScheduler}
                    callbacksCount={statsData?.callbacks_needed || 0}
                    focusCount={focusQueue?.leads?.length || 0}
                    isExpanded={!activeLead}
                />

                {/* Center/Right: Active Call Panel or Empty State */}
                {activeLead ? (
                    <ActiveCallPanel
                        lead={activeLead}
                        callDuration={callDuration}
                        callNotes={callNotes}
                        onNotesChange={setCallNotes}
                        onEndCall={endCall}
                    >
                        <OrderBuilder
                            products={products}
                            couriers={couriers}
                            cities={MOROCCAN_CITIES}
                            orderItems={orderItems}
                            onOrderItemsChange={setOrderItems}
                            selectedCity={selectedCity}
                            onCityChange={setSelectedCity}
                            selectedZone={selectedZone}
                            onZoneChange={setSelectedZone}
                            customerAddress={customerAddress}
                            onAddressChange={setCustomerAddress}
                            selectedCourier={selectedCourier}
                            onCourierChange={setSelectedCourier}
                            isExchange={isExchange}
                            onExchangeChange={setIsExchange}
                            subtotal={subtotal}
                            shippingCost={shippingCost}
                            total={total}
                        />
                        <ActionBar
                            onConfirm={() => handleOutcome('CONFIRMED')}
                            onCallback={() => setShowCallbackPicker(true)}
                            onNoAnswer={() => handleOutcome('NO_ANSWER')}
                            onCancel={(reason) => handleOutcome('CANCELLED', reason)}
                            onWrongNumber={() => handleOutcome('WRONG_NUMBER')}
                            onSkip={endCall}
                            confirmDisabled={orderItems.length === 0}
                        />
                    </ActiveCallPanel>
                ) : null}
            </div>

            {/* Modals */}
            <CallbackModal
                isOpen={showCallbackPicker}
                onClose={() => setShowCallbackPicker(false)}
                onSchedule={handleCallbackSchedule}
                mode="quick"
            />
            <CallbackModal
                isOpen={showCallbackModal}
                onClose={() => setShowCallbackModal(false)}
                onSchedule={handleCallbackSchedule}
                leadName={selectedLeadForCallback?.name}
                mode="full"
            />
        </div>
    );
}
