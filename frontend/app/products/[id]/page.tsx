'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package, ArrowLeft, Edit, Trash2, RefreshCw, TrendingUp,
    DollarSign, Boxes, Clock, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProduct, useStockMovements } from '@/hooks/useProducts';
import { format } from 'date-fns';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id ? Number(params.id) : null;

    const { data: product, isLoading, error } = useProduct(productId);
    const { data: stockMovements } = useStockMovements(productId);

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

    const getStockBadge = () => {
        if (product.is_out_of_stock) {
            return <Badge className="bg-red-600 text-white">Out of Stock</Badge>;
        }
        if (product.is_low_stock) {
            return <Badge className="bg-orange-600 text-white">Low Stock</Badge>;
        }
        return <Badge className="bg-green-600 text-white">In Stock</Badge>;
    };

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
                            {getStockBadge()}
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

                    {/* Stock Card */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Boxes className="h-5 w-5" />
                                Stock Level
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <p className={`text-4xl font-bold ${product.is_out_of_stock ? 'text-red-400' : product.is_low_stock ? 'text-orange-400' : 'text-white'}`}>
                                    {product.stock_quantity}
                                </p>
                                <p className="text-slate-400 text-sm">units in stock</p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                                <p className="text-slate-400">Low stock threshold</p>
                                <p className="text-white">{product.low_stock_threshold || 10}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-slate-400">Stock value</p>
                                <p className="text-blue-400 font-bold">
                                    {(product.stock_quantity * product.cost_price).toLocaleString()} MAD
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
