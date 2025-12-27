'use client';

import React, { useState } from 'react';
import { Package, Flame, Repeat, X, Plus, Minus } from 'lucide-react';
import CrossSellSuggestions from './CrossSellSuggestions';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
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
    variants?: { [key: string]: string[] };
    has_variants?: boolean;
    image_url?: string;
    product_variants?: ProductVariant[];
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

interface CityData {
    name: string;
    zones: string[];
    shipping: number;
}

interface OrderBuilderProps {
    products: Product[];
    couriers: Courier[];
    cities: CityData[];
    orderItems: OrderItem[];
    onOrderItemsChange: (items: OrderItem[]) => void;
    selectedCity: string;
    onCityChange: (city: string) => void;
    selectedZone: string;
    onZoneChange: (zone: string) => void;
    customerAddress: string;
    onAddressChange: (address: string) => void;
    selectedCourier: string;
    onCourierChange: (courier: string) => void;
    isExchange: boolean;
    onExchangeChange: (isExchange: boolean) => void;
    subtotal: number;
    shippingCost: number;
    total: number;
    utmSource: string;
    salesAction: 'normal' | 'upsell' | 'cross_sell' | 'exchange';
    onSalesActionChange: (action: 'normal' | 'upsell' | 'cross_sell' | 'exchange') => void;
}

// ═══════════════════════════════════════════════════════════════
// ORDER BUILDER COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function OrderBuilder({
    products,
    couriers,
    cities,
    orderItems,
    onOrderItemsChange,
    selectedCity,
    onCityChange,
    selectedZone,
    onZoneChange,
    customerAddress,
    onAddressChange,
    selectedCourier,
    onCourierChange,
    isExchange,
    onExchangeChange,
    subtotal,
    shippingCost,
    total,
    utmSource,
    salesAction,
    onSalesActionChange,
}: OrderBuilderProps) {
    // Local state for product selection
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
    const [quantity, setQuantity] = useState(1);

    // Derived values
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const isUpsell = totalQuantity > 1;
    const cityData = cities.find(c => c.name === selectedCity);

    // Helper functions for UTM Source styling
    const getSourceStyle = (source: string) => {
        switch (source?.toUpperCase()) {
            case 'FACEBOOK': return 'bg-[#1877F2]/20 text-[#1877F2]';
            case 'TIKTOK': return 'bg-gray-700 text-white';
            case 'GOOGLE': return 'bg-[#4285F4]/20 text-[#4285F4]';
            case 'INSTAGRAM': return 'bg-[#E4405F]/20 text-[#E4405F]';
            case 'WHATSAPP': return 'bg-[#25D366]/20 text-[#25D366]';
            default: return 'bg-[#21262d] text-[#8b949e]';
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source?.toUpperCase()) {
            case 'FACEBOOK': return '📘';
            case 'TIKTOK': return '🎵';
            case 'GOOGLE': return '🔍';
            case 'INSTAGRAM': return '📸';
            case 'WHATSAPP': return '💬';
            default: return '🌐';
        }
    };

    // Product selection handler - parses "productId-variantId" format
    const handleProductSelect = (value: string) => {
        if (!value) {
            setSelectedProduct(null);
            setSelectedVariant(null);
            setSelectedVariants({});
            setQuantity(1);
            return;
        }

        const [productIdStr, variantIdStr] = value.split('-');
        const productId = parseInt(productIdStr);
        const variantId = parseInt(variantIdStr);

        const product = products.find(p => p.id === productId);
        if (!product) return;

        setSelectedProduct(product);
        setSelectedVariants({});
        setQuantity(1);

        // If variant ID is provided (not 0), find the variant
        if (variantId && product.product_variants) {
            const variant = product.product_variants.find(v => v.id === variantId);
            setSelectedVariant(variant || null);
        } else {
            setSelectedVariant(null);
        }
    };

    // Check if all variants are selected (for legacy variant system)
    const allVariantsSelected = () => {
        if (!selectedProduct?.variants) return true;
        return Object.keys(selectedProduct.variants).every(key => selectedVariants[key]);
    };

    // Get variant display label
    const getVariantLabel = (variant: ProductVariant) => {
        const parts = [];
        if (variant.color) parts.push(variant.color);
        if (variant.size) parts.push(variant.size);
        if (variant.capacity) parts.push(variant.capacity);
        return parts.length > 0 ? parts.join(' / ') : variant.variant_name;
    };

    // Add to order
    const addToOrder = () => {
        if (!selectedProduct) return;

        // Determine price and label based on variant
        let price: number;
        let productName: string;
        let variantInfo: { [key: string]: string } | undefined;

        if (selectedVariant) {
            // Using database variant
            price = selectedVariant.price_override || Number(selectedProduct.selling_price) || 0;
            const variantLabel = getVariantLabel(selectedVariant);
            productName = `${selectedProduct.name} [${variantLabel}]`;
            variantInfo = {
                variant_id: String(selectedVariant.id),
                variant_name: selectedVariant.variant_name,
                ...(selectedVariant.color && { color: selectedVariant.color }),
                ...(selectedVariant.size && { size: selectedVariant.size }),
                ...(selectedVariant.capacity && { capacity: selectedVariant.capacity }),
            };
        } else if (selectedProduct.has_variants && Object.keys(selectedVariants).length > 0) {
            // Using legacy variant system
            if (!allVariantsSelected()) return;
            price = Number(selectedProduct.selling_price) || 0;
            const variantLabel = Object.values(selectedVariants).join(' / ');
            productName = `${selectedProduct.name} [${variantLabel}]`;
            variantInfo = { ...selectedVariants };
        } else {
            // No variants
            price = Number(selectedProduct.selling_price) || 0;
            productName = selectedProduct.name;
        }

        const newItem: OrderItem = {
            product_id: selectedProduct.id,
            product_name: productName,
            quantity,
            unit_price: price,
            total_price: price * quantity,
            selected_variants: variantInfo,
        };

        onOrderItemsChange([...orderItems, newItem]);
        setSelectedProduct(null);
        setSelectedVariant(null);
        setSelectedVariants({});
        setQuantity(1);
    };

    // Remove item from order
    const removeItem = (index: number) => {
        onOrderItemsChange(orderItems.filter((_, i) => i !== index));
    };

    // ═══════════════════════════════════════════════════════════════
    // NEW: Update item quantity in cart
    // ═══════════════════════════════════════════════════════════════
    const updateItemQuantity = (index: number, newQty: number) => {
        if (newQty < 1) return; // Minimum 1

        const updated = [...orderItems];
        updated[index] = {
            ...updated[index],
            quantity: newQty,
            total_price: updated[index].unit_price * newQty,
        };
        onOrderItemsChange(updated);
    };

    return (
        <div className="space-y-3">
            {/* Upsell Badge */}
            {isUpsell && (
                <div className="px-3 py-1.5 bg-orange-500/15 border border-orange-500 rounded-md flex items-center gap-2">
                    <Flame size={16} className="text-orange-500" />
                    <span className="text-xs font-semibold text-orange-500">
                        🔥 UPSELL ACTIVE! ({totalQuantity} items)
                    </span>
                </div>
            )}

            {/* Header */}
            <h4 className="text-[13px] font-semibold text-foreground">
                🛒 ORDER BUILDER
            </h4>

            {/* UTM Source & Sale Type Section */}
            <div className="grid grid-cols-2 gap-3">
                {/* UTM Source Badge */}
                <div>
                    <label className="block text-xs text-[#8b949e] mb-1">Traffic Source</label>
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${getSourceStyle(utmSource)}`}>
                        {getSourceIcon(utmSource)}
                        {utmSource || 'DIRECT'}
                    </div>
                </div>

                {/* Sale Type Dropdown */}
                <div>
                    <label className="block text-xs text-[#8b949e] mb-1">Sale Type</label>
                    <select
                        value={salesAction}
                        onChange={(e) => onSalesActionChange(e.target.value as any)}
                        className="w-full p-3 bg-[#21262d] border border-[#30363d] rounded-lg text-[#e6edf3] text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                        <option value="normal">Normal Sale</option>
                        <option value="upsell">↑ Upsell</option>
                        <option value="cross_sell">+ Cross-sell</option>
                        <option value="exchange">⟳ Exchange</option>
                    </select>
                </div>
            </div>

            {/* Product Selection */}
            <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                    value={selectedVariant ? `${selectedProduct?.id}-${selectedVariant.id}` : (selectedProduct ? `${selectedProduct.id}-0` : '')}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="p-2.5 bg-[#21262d] border border-[#30363d] rounded-lg text-[#e6edf3] text-[13px] focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                    <option value="">Select product...</option>
                    {products.map((p) => {
                        // If product has database variants, show as optgroup
                        if (p.product_variants && p.product_variants.length > 0) {
                            return (
                                <optgroup key={p.id} label={`📦 ${p.name}`}>
                                    {p.product_variants.map(v => {
                                        // Build variant label from color/size/capacity
                                        const parts = [];
                                        if (v.color) parts.push(v.color);
                                        if (v.size) parts.push(v.size);
                                        if (v.capacity) parts.push(v.capacity);
                                        const variantLabel = parts.length > 0 ? parts.join(' / ') : v.variant_name;

                                        return (
                                            <option
                                                key={`${p.id}-${v.id}`}
                                                value={`${p.id}-${v.id}`}
                                                disabled={v.stock_quantity <= 0}
                                            >
                                                {variantLabel} • {v.price_override || p.selling_price} MAD • {v.stock_quantity} in stock{v.stock_quantity <= 0 ? ' ❌' : ''}
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            );
                        }
                        // If no variants, show product directly
                        return (
                            <option key={p.id} value={`${p.id}-0`}>
                                {p.name} • {p.selling_price} MAD{p.stock_quantity < 5 ? ' ⚠️' : ''}
                            </option>
                        );
                    })}
                </select>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-9 bg-secondary border border-border rounded text-foreground cursor-pointer hover:bg-muted transition-colors"
                    >
                        -
                    </button>
                    <span className="w-8 text-center text-foreground font-semibold">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-9 bg-secondary border border-border rounded text-foreground cursor-pointer hover:bg-muted transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Variant Selection */}
            {selectedProduct?.has_variants && selectedProduct.variants && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-secondary rounded-md">
                    {Object.entries(selectedProduct.variants).map(([type, options]) => (
                        <select
                            key={type}
                            value={selectedVariants[type] || ''}
                            onChange={(e) => setSelectedVariants({ ...selectedVariants, [type]: e.target.value })}
                            className={`p-2 bg-background border rounded text-foreground text-xs focus:outline-none ${selectedVariants[type] ? 'border-emerald-500' : 'border-red-500'
                                }`}
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
                className={`w-full py-2.5 rounded-md text-white text-[13px] font-semibold transition-colors ${!selectedProduct || (selectedProduct.has_variants && !allVariantsSelected())
                    ? 'bg-secondary cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    }`}
            >
                + Add to Order {selectedProduct && `(${((Number(selectedProduct.selling_price) || 0) * quantity).toFixed(0)} MAD)`}
            </button>

            {/* Product Preview Card */}
            {selectedProduct && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-md bg-secondary border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                        {selectedProduct.image_url ? (
                            <img
                                src={selectedProduct.image_url}
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <Package size={24} className="text-muted-foreground" />
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                            {selectedProduct.name}
                        </h4>

                        {/* Selected Variants */}
                        {Object.keys(selectedVariants).length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mb-1.5">
                                {Object.entries(selectedVariants).map(([key, value]) => (
                                    value && (
                                        <span key={key} className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded text-[11px] text-emerald-500">
                                            {key}: {value}
                                        </span>
                                    )
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-emerald-500">
                                {((Number(selectedProduct.selling_price) || 0) * quantity).toFixed(0)} MAD
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${selectedProduct.stock_quantity > 10
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : selectedProduct.stock_quantity > 0
                                    ? 'bg-amber-500/15 text-amber-500'
                                    : 'bg-red-500/15 text-red-500'
                                }`}>
                                {selectedProduct.stock_quantity} in stock
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Order Items (Cart) - WITH QUANTITY +/- CONTROLS                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {orderItems.length > 0 && (
                <div className="space-y-2">
                    {orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg">
                            {/* Product Name */}
                            <span className="text-foreground text-sm flex-1 truncate mr-2">
                                {item.product_name}
                            </span>

                            {/* Quantity +/- Controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center border border-border rounded overflow-hidden">
                                    <button
                                        onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                                        className="w-7 h-7 bg-secondary text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="w-8 text-center text-sm font-semibold text-foreground">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                                        className="w-7 h-7 bg-secondary text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>

                                {/* Price */}
                                <span className="text-emerald-500 font-semibold text-sm min-w-[70px] text-right">
                                    {(Number(item.total_price) || 0).toFixed(0)} MAD
                                </span>

                                {/* Remove Button */}
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cross-sell Suggestions from Sales Optimization */}
            {orderItems.length > 0 && (
                <CrossSellSuggestions
                    cartItems={orderItems.map(item => ({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        variant_id: item.selected_variants?.variant_id ? parseInt(item.selected_variants.variant_id) : null,
                        variant_name: item.selected_variants?.variant_name || null,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                        sale_type: 'normal',
                    }))}
                    onAddToCart={(product) => {
                        const newItem: OrderItem = {
                            product_id: product.id,
                            product_name: product.name,
                            quantity: 1,
                            unit_price: product.selling_price,
                            total_price: product.selling_price,
                            selected_variants: { sale_type: 'cross-sell' },
                        };
                        onOrderItemsChange([...orderItems, newItem]);
                    }}
                />
            )}

            {/* Logistics Section */}
            <div className="p-3 bg-card rounded-lg">
                <h5 className="text-[11px] font-semibold text-muted-foreground mb-2.5">
                    🚚 DELIVERY INFO
                </h5>

                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* City */}
                    <select
                        value={selectedCity}
                        onChange={(e) => { onCityChange(e.target.value); onZoneChange(''); }}
                        className="p-2 bg-background border border-border rounded text-foreground text-xs focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="">Select City...</option>
                        {cities.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                    </select>

                    {/* Zone */}
                    <select
                        value={selectedZone}
                        onChange={(e) => onZoneChange(e.target.value)}
                        disabled={!selectedCity || !cityData?.zones.length}
                        className="p-2 bg-background border border-border rounded text-foreground text-xs focus:border-emerald-500 focus:outline-none disabled:opacity-50"
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
                    onChange={(e) => onAddressChange(e.target.value)}
                    placeholder="Full address..."
                    className="w-full p-2 bg-background border border-border rounded text-foreground text-xs mb-2 placeholder:text-muted-foreground/50 focus:border-emerald-500 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                    {/* Courier */}
                    <select
                        value={selectedCourier}
                        onChange={(e) => onCourierChange(e.target.value)}
                        className="p-2 bg-background border border-border rounded text-foreground text-xs focus:border-emerald-500 focus:outline-none"
                    >
                        {couriers.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                        <option value="PRIVATE">Private Delivery</option>
                    </select>

                    {/* Exchange Checkbox */}
                    <label className={`flex items-center gap-2 p-2 rounded border border-border cursor-pointer transition-colors ${isExchange ? 'bg-purple-500/15' : 'bg-background'
                        }`}>
                        <input
                            type="checkbox"
                            checked={isExchange}
                            onChange={(e) => onExchangeChange(e.target.checked)}
                            className="accent-purple-500"
                        />
                        <span className="text-[11px] text-foreground flex items-center gap-1">
                            <Repeat size={12} />
                            Exchange
                        </span>
                    </label>
                </div>
            </div>

            {/* Price Summary */}
            <div className="p-3 bg-emerald-600 rounded-lg">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                    <span>Subtotal:</span>
                    <span>{subtotal.toFixed(0)} MAD</span>
                </div>
                <div className="flex justify-between text-xs text-white/80 mb-2">
                    <span>Shipping {isExchange && '(Exchange)'}:</span>
                    <span>{isExchange ? 'FREE' : `${shippingCost} MAD`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/20">
                    <span>TOTAL:</span>
                    <span>{total.toFixed(0)} MAD</span>
                </div>
            </div>
        </div>
    );
}
