'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package, ArrowLeft, Edit, RefreshCw,
    DollarSign, Boxes, Clock, Star, Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProduct, useStockMovements } from '@/hooks/useProducts';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Color helper function
const getColorCode = (colorName: string): string => {
    const colors: Record<string, string> = {
        'black': '#000000',
        'white': '#FFFFFF',
        'red': '#EF4444',
        'blue': '#3B82F6',
        'green': '#22C55E',
        'yellow': '#EAB308',
        'orange': '#F97316',
        'purple': '#A855F7',
        'pink': '#EC4899',
        'gray': '#6B7280',
        'grey': '#6B7280',
        'gold': '#F59E0B',
        'silver': '#9CA3AF',
        'navy': '#1E3A5F',
        'brown': '#92400E',
        'beige': '#D4C4A8',
    };
    return colors[colorName.toLowerCase()] || '#6B7280';
};

interface Variant {
    id: number;
    variant_name: string;
    sku: string;
    stock_quantity: number;
    price_override: number | null;
    color?: string;
    size?: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id ? Number(params.id) : null;

    const { data: product, isLoading, error } = useProduct(productId);
    const { data: stockMovements } = useStockMovements(productId);

    // State for variants
    const [variants, setVariants] = useState<Variant[]>([]);
    const [variantsLoading, setVariantsLoading] = useState(false);

    // Fetch variants when product has_variants
    useEffect(() => {
        const fetchVariants = async () => {
            if (!product?.has_variants || !productId) return;

            setVariantsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/v1/products/${productId}/variants`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setVariants(data);
                }
            } catch (err) {
                console.error('Failed to fetch variants', err);
            } finally {
                setVariantsLoading(false);
            }
        };

        fetchVariants();
    }, [product?.has_variants, productId]);

    // Calculate total stock from variants or product
    const getTotalStock = (): number => {
        if (product?.has_variants && variants.length > 0) {
            return variants.reduce((sum, v) => sum + v.stock_quantity, 0);
        }
        return product?.stock_quantity || 0;
    };

    // Calculate stock value
    const getStockValue = (): number => {
        if (product?.has_variants && variants.length > 0) {
            return variants.reduce((sum, v) => {
                return sum + (v.stock_quantity * (product.cost_price || 0));
            }, 0);
        }
        return (product?.stock_quantity || 0) * (product?.cost_price || 0);
    };

    // Get stock status based on calculated total
    const getStockStatus = () => {
        const total = getTotalStock();
        if (total === 0) return { label: 'Out of Stock', color: 'red' };
        if (total <= (product?.low_stock_threshold || 10)) return { label: 'Low Stock', color: 'orange' };
        return { label: 'In Stock', color: 'green' };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-slate-400">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
                <Card className="bg-slate-800 border-slate-700 max-w-md">
                    <CardContent className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
                        <p className="text-slate-400 mb-4">The product you're looking for doesn't exist.</p>
                        <Button onClick={() => router.push('/products')} className="bg-blue-600 hover:bg-blue-700">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const stockStatus = getStockStatus();
    const totalStock = getTotalStock();

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {product.name}
                            {product.is_featured && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {product.sku}
                            </Badge>
                            {/* Dynamic Stock Badge */}
                            <Badge className={`${stockStatus.color === 'red' ? 'bg-red-600' :
                                    stockStatus.color === 'orange' ? 'bg-orange-600' :
                                        'bg-green-600'
                                } text-white`}>
                                {stockStatus.label}
                            </Badge>
                            {product.has_variants && (
                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                    {variants.length} Variants
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => router.push(`/products/${productId}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Product
                    </Button>
                </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Product Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-400 text-sm">Category</p>
                                    <p className="text-white font-medium">{product.category_name || 'Uncategorized'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Status</p>
                                    <p className="text-white font-medium">{product.is_active ? 'Active' : 'Inactive'}</p>
                                </div>
                            </div>
                            {product.description && (
                                <div>
                                    <p className="text-slate-400 text-sm">Description</p>
                                    <p className="text-white">{product.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Product Variants */}
                    {product?.has_variants && variants.length > 0 && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-purple-400" />
                                        Product Variants
                                        <span className="text-sm text-slate-400 font-normal">({variants.length})</span>
                                    </CardTitle>
                                    <span className="text-sm text-blue-400">
                                        Total Stock: {totalStock}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {variants.map((variant) => (
                                        <div
                                            key={variant.id}
                                            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Color swatch if color variant */}
                                                {variant.color && (
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-slate-500 shadow-inner"
                                                        style={{ backgroundColor: getColorCode(variant.color) }}
                                                        title={variant.color}
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">{variant.variant_name}</p>
                                                    <p className="text-xs text-slate-500">{variant.sku}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-right">
                                                    <p className="text-slate-400 text-xs">Stock</p>
                                                    <p className={`font-medium ${variant.stock_quantity === 0 ? 'text-red-400' :
                                                            variant.stock_quantity <= 5 ? 'text-orange-400' : 'text-white'
                                                        }`}>
                                                        {variant.stock_quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-400 text-xs">Price</p>
                                                    <p className="text-emerald-400 font-medium">
                                                        {(variant.price_override || product?.selling_price || 0).toLocaleString()} MAD
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stock Movements */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Recent Stock Movements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stockMovements && stockMovements.length > 0 ? (
                                <div className="space-y-2">
                                    {stockMovements.slice(0, 5).map((movement: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                            <div>
                                                <p className="text-white">{movement.reason}</p>
                                                <p className="text-slate-400 text-sm">{movement.notes || 'No notes'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${movement.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                                </p>
                                                <p className="text-slate-400 text-xs">
                                                    {movement.created_at ? format(new Date(movement.created_at), 'MMM d, HH:mm') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-center py-4">No stock movements recorded</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Side Column - Stats */}
                <div className="space-y-6">
                    {/* Pricing Card */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-slate-400">Cost Price</p>
                                <p className="text-white font-medium">{product.cost_price.toLocaleString()} MAD</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-slate-400">Selling Price</p>
                                <p className="text-emerald-400 font-bold text-xl">{product.selling_price.toLocaleString()} MAD</p>
                            </div>
                            <div className="pt-4 border-t border-slate-700">
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-400">Profit per unit</p>
                                    <p className="text-green-400 font-bold">
                                        {(product.selling_price - product.cost_price).toLocaleString()} MAD
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-slate-400">Margin</p>
                                    <p className={`font-bold ${product.profit_margin >= 30 ? 'text-green-400' : product.profit_margin >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {product.profit_margin.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Card - Updated to use calculated stock */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Boxes className="h-5 w-5" />
                                Stock Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <p className={`text-5xl font-bold ${totalStock === 0 ? 'text-red-400' :
                                        totalStock <= (product.low_stock_threshold || 10) ? 'text-orange-400' :
                                            'text-green-400'
                                    }`}>
                                    {totalStock}
                                </p>
                                <p className="text-slate-400 text-sm mt-1">units in stock</p>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-700">
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-400">Low stock threshold</p>
                                    <p className="text-white">{product.low_stock_threshold || 10}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-400">Stock value</p>
                                    <p className="text-blue-400 font-bold">
                                        {getStockValue().toLocaleString()} MAD
                                    </p>
                                </div>
                                {product.has_variants && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-400">Variants</p>
                                        <p className="text-purple-400 font-medium">{variants.length}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
