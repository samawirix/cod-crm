'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Package, X } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    selling_price: number;
    image_url?: string;
    is_out_of_stock: boolean;
}

interface OrderItem {
    product_id: number;
    product_name: string;
    variant_id?: number | null;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    sale_type: string;
}

interface CrossSellSuggestionsProps {
    cartItems: OrderItem[];
    onAddToCart: (product: Product) => void;
    apiUrl?: string;
}

export default function CrossSellSuggestions({
    cartItems,
    onAddToCart,
    apiUrl = 'http://localhost:8000',
}: CrossSellSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (cartItems.length === 0) {
                setSuggestions([]);
                setIsDismissed(false);
                return;
            }

            setIsLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                const allSuggestions: Product[] = [];
                const seenIds = new Set<number>();
                const cartProductIds = new Set(cartItems.map(item => item.product_id));

                for (const item of cartItems) {
                    const response = await fetch(
                        `${apiUrl}/api/v1/products/${item.product_id}/cross-sells`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    );

                    if (response.ok) {
                        const crossSells: Product[] = await response.json();

                        for (const product of crossSells) {
                            // Only add if not already in cart and in stock
                            if (!seenIds.has(product.id) && !cartProductIds.has(product.id) && !product.is_out_of_stock) {
                                seenIds.add(product.id);
                                allSuggestions.push(product);
                            }
                        }
                    }
                }

                setSuggestions(allSuggestions.slice(0, 4));
            } catch (error) {
                console.error('Failed to fetch cross-sell suggestions:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [cartItems, apiUrl]);

    if (isDismissed || suggestions.length === 0) {
        return null;
    }

    const handleAddProduct = (product: Product) => {
        onAddToCart(product);
        setSuggestions(prev => prev.filter(p => p.id !== product.id));
    };

    return (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-500">
                        Recommended Add-ons
                    </span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                        Cross-sell
                    </span>
                </div>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {suggestions.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center gap-2 bg-card/50 border border-border rounded-lg p-2 hover:border-amber-500/50 transition-colors"
                        >
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                                <p className="text-xs text-emerald-500 font-semibold">{product.selling_price} MAD</p>
                            </div>
                            <button
                                onClick={() => handleAddProduct(product)}
                                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors flex-shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground mt-2 text-center">
                💡 Products configured in Sales Optimization
            </p>
        </div>
    );
}
