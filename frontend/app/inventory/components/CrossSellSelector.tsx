'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Search } from 'lucide-react';

// Minimal product interface for cross-sell selection
export interface CrossSellProduct {
    id: number;
    name: string;
    selling_price: number;
    image_url?: string;
    is_active?: boolean;
}

interface CrossSellSelectorProps {
    productId: number;
    currentCrossSellIds: number[];
    allProducts: CrossSellProduct[];
    onUpdate: (ids: number[]) => void;
    isLoading?: boolean;
}

export default function CrossSellSelector({
    productId,
    currentCrossSellIds,
    allProducts,
    onUpdate,
    isLoading = false,
}: CrossSellSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>(currentCrossSellIds || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        setSelectedIds(currentCrossSellIds || []);
    }, [currentCrossSellIds]);

    const availableProducts = allProducts.filter(
        (p) =>
            p.id !== productId &&
            !selectedIds.includes(p.id) &&
            (p.is_active !== false) &&
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProducts = allProducts.filter((p) => selectedIds.includes(p.id));

    const handleAddProduct = (id: number) => {
        const newIds = [...selectedIds, id];
        setSelectedIds(newIds);
        onUpdate(newIds);
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    const handleRemoveProduct = (id: number) => {
        const newIds = selectedIds.filter((sid) => sid !== id);
        setSelectedIds(newIds);
        onUpdate(newIds);
    };

    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Cross-sell Products</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {selectedIds.length} selected
                </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                Suggest these products when this item is added to cart
            </p>

            {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                        >
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-foreground">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.selling_price} MAD</p>
                            </div>
                            <button
                                onClick={() => handleRemoveProduct(product.id)}
                                className="ml-2 p-1 hover:bg-destructive/20 rounded transition-colors"
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search products to add..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {isDropdownOpen && availableProducts.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableProducts.slice(0, 10).map((product) => (
                            <button
                                key={product.id}
                                onClick={() => handleAddProduct(product.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                                disabled={isLoading}
                            >
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                        <Package className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.selling_price} MAD</p>
                                </div>
                                <Plus className="w-5 h-5 text-primary" />
                            </button>
                        ))}
                    </div>
                )}

                {isDropdownOpen && searchTerm && availableProducts.length === 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
                        No products found
                    </div>
                )}
            </div>

            {isDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            )}
        </div>
    );
}
