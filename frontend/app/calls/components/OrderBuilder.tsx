'use client';

import React, { useState } from 'react';
import { Package, Flame, Repeat, X } from 'lucide-react';

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
}: OrderBuilderProps) {
    // Local state for product selection
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
    const [quantity, setQuantity] = useState(1);

    // Derived values
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const isUpsell = totalQuantity > 1;
    const cityData = cities.find(c => c.name === selectedCity);

    // Product selection handler
    const handleProductSelect = (productId: number) => {
        const product = products.find(p => p.id === productId);
        setSelectedProduct(product || null);
        setSelectedVariants({});
        setQuantity(1);
    };

    // Check if all variants are selected
    const allVariantsSelected = () => {
        if (!selectedProduct?.variants) return true;
        return Object.keys(selectedProduct.variants).every(key => selectedVariants[key]);
    };

    // Add to order
    const addToOrder = () => {
        if (!selectedProduct) return;
        if (selectedProduct.has_variants && !allVariantsSelected()) return;

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

        onOrderItemsChange([...orderItems, newItem]);
        setSelectedProduct(null);
        setSelectedVariants({});
        setQuantity(1);
    };

    // Remove item from order
    const removeItem = (index: number) => {
        onOrderItemsChange(orderItems.filter((_, i) => i !== index));
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
            <h4 className="text-[13px] font-semibold text-light-100">
                🛒 ORDER BUILDER
            </h4>

            {/* Product Selection */}
            <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => handleProductSelect(Number(e.target.value))}
                    className="p-2.5 bg-dark-800 border border-dark-600 rounded-md text-light-100 text-[13px] focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                    <option value="">Select product...</option>
                    {products.map((p) => {
                        if (p.product_variants && p.product_variants.length > 0) {
                            return (
                                <optgroup key={p.id} label={`📦 ${p.name}`}>
                                    {p.product_variants.map(v => (
                                        <option
                                            key={`${p.id}-${v.id}`}
                                            value={p.id}
                                            disabled={!v.is_in_stock}
                                        >
                                            {v.variant_name} • {v.price_override || p.selling_price} MAD • {v.stock_quantity} in stock {!v.is_in_stock ? '❌' : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            );
                        }
                        return (
                            <option key={p.id} value={p.id}>
                                {p.name} - {p.selling_price} MAD {p.stock_quantity < 5 ? '⚠️' : ''}
                            </option>
                        );
                    })}
                </select>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-9 bg-dark-700 border border-dark-600 rounded text-light-100 cursor-pointer hover:bg-dark-600 transition-colors"
                    >
                        -
                    </button>
                    <span className="w-8 text-center text-light-100 font-semibold">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-9 bg-dark-700 border border-dark-600 rounded text-light-100 cursor-pointer hover:bg-dark-600 transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Variant Selection */}
            {selectedProduct?.has_variants && selectedProduct.variants && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-dark-700 rounded-md">
                    {Object.entries(selectedProduct.variants).map(([type, options]) => (
                        <select
                            key={type}
                            value={selectedVariants[type] || ''}
                            onChange={(e) => setSelectedVariants({ ...selectedVariants, [type]: e.target.value })}
                            className={`p-2 bg-dark-900 border rounded text-light-100 text-xs focus:outline-none ${selectedVariants[type] ? 'border-emerald-500' : 'border-red-500'
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
                        ? 'bg-dark-700 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    }`}
            >
                + Add to Order {selectedProduct && `(${((Number(selectedProduct.selling_price) || 0) * quantity).toFixed(0)} MAD)`}
            </button>

            {/* Product Preview Card */}
            {selectedProduct && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-md bg-dark-700 border border-dark-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {selectedProduct.image_url ? (
                            <img
                                src={selectedProduct.image_url}
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <Package size={24} className="text-light-200" />
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-light-100 mb-1">
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

            {/* Order Items (Cart) */}
            {orderItems.length > 0 && (
                <div className="space-y-1">
                    {orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-dark-800 rounded text-xs">
                            <span className="text-light-100">{item.product_name} ×{item.quantity}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-500 font-semibold">{(Number(item.total_price) || 0).toFixed(0)} MAD</span>
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="text-red-500 hover:text-red-400 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Logistics Section */}
            <div className="p-3 bg-dark-800 rounded-lg">
                <h5 className="text-[11px] font-semibold text-light-200 mb-2.5">
                    🚚 DELIVERY INFO
                </h5>

                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* City */}
                    <select
                        value={selectedCity}
                        onChange={(e) => { onCityChange(e.target.value); onZoneChange(''); }}
                        className="p-2 bg-dark-900 border border-dark-600 rounded text-light-100 text-xs focus:border-emerald-500 focus:outline-none"
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
                        className="p-2 bg-dark-900 border border-dark-600 rounded text-light-100 text-xs focus:border-emerald-500 focus:outline-none disabled:opacity-50"
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
                    className="w-full p-2 bg-dark-900 border border-dark-600 rounded text-light-100 text-xs mb-2 placeholder:text-light-200/50 focus:border-emerald-500 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                    {/* Courier */}
                    <select
                        value={selectedCourier}
                        onChange={(e) => onCourierChange(e.target.value)}
                        className="p-2 bg-dark-900 border border-dark-600 rounded text-light-100 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                        {couriers.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                        <option value="PRIVATE">Private Delivery</option>
                    </select>

                    {/* Exchange Checkbox */}
                    <label className={`flex items-center gap-2 p-2 rounded border border-dark-600 cursor-pointer transition-colors ${isExchange ? 'bg-purple-500/15' : 'bg-dark-900'
                        }`}>
                        <input
                            type="checkbox"
                            checked={isExchange}
                            onChange={(e) => onExchangeChange(e.target.checked)}
                            className="accent-purple-500"
                        />
                        <span className="text-[11px] text-light-100 flex items-center gap-1">
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
