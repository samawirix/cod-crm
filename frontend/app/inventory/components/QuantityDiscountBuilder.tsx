'use client';

import React, { useState, useEffect } from 'react';
import { Percent, Plus, Trash2, AlertCircle } from 'lucide-react';

interface DiscountTier {
    min_qty: number;
    discount_percent: number;
}

interface QuantityDiscountBuilderProps {
    currentDiscounts: DiscountTier[];
    onUpdate: (discounts: DiscountTier[]) => void;
    basePrice: number;
    isLoading?: boolean;
}

export default function QuantityDiscountBuilder({
    currentDiscounts,
    onUpdate,
    basePrice,
    isLoading = false,
}: QuantityDiscountBuilderProps) {
    const [tiers, setTiers] = useState<DiscountTier[]>(currentDiscounts || []);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTiers(currentDiscounts || []);
    }, [currentDiscounts]);

    const addTier = () => {
        const lastQty = tiers.length > 0 ? Math.max(...tiers.map((t) => t.min_qty)) : 1;
        const newTier: DiscountTier = { min_qty: lastQty + 1, discount_percent: 5 };
        const newTiers = [...tiers, newTier].sort((a, b) => a.min_qty - b.min_qty);
        setTiers(newTiers);
        onUpdate(newTiers);
        setError(null);
    };

    const removeTier = (index: number) => {
        const newTiers = tiers.filter((_, i) => i !== index);
        setTiers(newTiers);
        onUpdate(newTiers);
        setError(null);
    };

    const updateTier = (index: number, field: keyof DiscountTier, value: number) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };

        if (field === 'min_qty' && value < 2) {
            setError('Minimum quantity must be at least 2');
            return;
        }
        if (field === 'discount_percent' && (value < 0 || value > 100)) {
            setError('Discount must be between 0% and 100%');
            return;
        }

        const quantities = newTiers.map((t) => t.min_qty);
        if (new Set(quantities).size !== quantities.length) {
            setError('Each quantity tier must be unique');
            return;
        }

        newTiers.sort((a, b) => a.min_qty - b.min_qty);
        setTiers(newTiers);
        onUpdate(newTiers);
        setError(null);
    };

    const calculatePreview = (qty: number, discount: number) => {
        const subtotal = basePrice * qty;
        const discountAmount = subtotal * (discount / 100);
        return {
            subtotal: subtotal.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            finalPrice: (subtotal - discountAmount).toFixed(2),
        };
    };

    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-foreground">Quantity Discounts</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {tiers.length} tiers
                    </span>
                </div>
                <button
                    onClick={addTier}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Add Tier
                </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                Offer discounts when customers buy multiple units
            </p>

            {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {tiers.length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 text-sm font-medium text-muted-foreground">
                        <div className="col-span-2">Min Qty</div>
                        <div className="col-span-2">Discount</div>
                        <div className="col-span-3">Unit Price</div>
                        <div className="col-span-3">Example (×qty)</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {tiers.map((tier, index) => {
                        const preview = calculatePreview(tier.min_qty, tier.discount_percent);
                        const discountedUnitPrice = basePrice * (1 - tier.discount_percent / 100);

                        return (
                            <div key={index} className="grid grid-cols-12 gap-4 p-3 border-t border-border items-center">
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="2"
                                        value={tier.min_qty}
                                        onChange={(e) => updateTier(index, 'min_qty', parseInt(e.target.value) || 2)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={tier.discount_percent}
                                            onChange={(e) => updateTier(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 pr-8 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            disabled={isLoading}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground line-through">{basePrice.toFixed(2)}</span>
                                        <span className="text-sm font-semibold text-emerald-500">{discountedUnitPrice.toFixed(2)} MAD</span>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">×{tier.min_qty} = </span>
                                        <span className="font-semibold text-foreground">{preview.finalPrice} MAD</span>
                                        <span className="text-xs text-amber-500 ml-1">(-{preview.discountAmount})</span>
                                    </div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <button
                                        onClick={() => removeTier(index)}
                                        disabled={isLoading}
                                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                    <Percent className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No quantity discounts configured</p>
                    <p className="text-xs mt-1">Click "Add Tier" to create volume pricing</p>
                </div>
            )}

            {tiers.length > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Discount Summary:</p>
                    <div className="flex flex-wrap gap-2">
                        {tiers.map((tier, index) => (
                            <span key={index} className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded">
                                Buy {tier.min_qty}+ → {tier.discount_percent}% off
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
