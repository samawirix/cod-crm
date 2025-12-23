'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package, ArrowLeft, Save, RefreshCw, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useProduct, useUpdateProduct, useCategories } from '@/hooks/useProducts';
import { Category } from '@/lib/api';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id ? Number(params.id) : null;

    // Fetch product data
    const { data: product, isLoading, error } = useProduct(productId);
    const { data: categories } = useCategories();
    const updateProduct = useUpdateProduct();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        low_stock_threshold: '',
        is_active: true,
        is_featured: false,
    });

    // Populate form when product loads
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                description: product.description || '',
                category_id: product.category_id?.toString() || '',
                cost_price: product.cost_price?.toString() || '',
                selling_price: product.selling_price?.toString() || '',
                stock_quantity: product.stock_quantity?.toString() || '',
                low_stock_threshold: product.low_stock_threshold?.toString() || '10',
                is_active: product.is_active ?? true,
                is_featured: product.is_featured ?? false,
            });
        }
    }, [product]);

    const handleSubmit = async () => {
        if (!productId || !formData.name || !formData.sku || !formData.selling_price) return;

        try {
            await updateProduct.mutateAsync({
                productId,
                data: {
                    name: formData.name,
                    sku: formData.sku,
                    description: formData.description || undefined,
                    category_id: formData.category_id ? Number(formData.category_id) : undefined,
                    cost_price: Number(formData.cost_price) || 0,
                    selling_price: Number(formData.selling_price),
                    stock_quantity: Number(formData.stock_quantity) || 0,
                    low_stock_threshold: Number(formData.low_stock_threshold) || 10,
                    is_active: formData.is_active,
                    is_featured: formData.is_featured,
                },
            });
            router.push('/products');
        } catch (err) {
            console.error('Failed to update product:', err);
        }
    };

    if (error) {
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
                            <Package className="h-7 w-7" />
                            Edit Product
                        </h1>
                        <p className="text-slate-400">
                            {isLoading ? 'Loading...' : product?.name || 'Update product details'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300"
                        onClick={() => router.push('/products')}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={updateProduct.isPending || !formData.name || !formData.sku || !formData.selling_price}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                        <p className="text-slate-400">Loading product...</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-slate-300">Product Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter product name"
                                    className="bg-slate-700 border-slate-600 text-white mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300">SKU *</Label>
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                    placeholder="e.g., PROD-001"
                                    className="bg-slate-700 border-slate-600 text-white mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300">Category</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {(categories || []).map((cat: Category) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()} className="text-white">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-slate-300">Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Product description..."
                                    className="bg-slate-700 border-slate-600 text-white min-h-[100px] mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Stock */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Pricing & Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300">Cost Price (MAD)</Label>
                                    <Input
                                        type="number"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                        placeholder="0"
                                        className="bg-slate-700 border-slate-600 text-white mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Selling Price (MAD) *</Label>
                                    <Input
                                        type="number"
                                        value={formData.selling_price}
                                        onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                                        placeholder="0"
                                        className="bg-slate-700 border-slate-600 text-white mt-1"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300">Stock Quantity</Label>
                                    <Input
                                        type="number"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        placeholder="0"
                                        className="bg-slate-700 border-slate-600 text-white mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Low Stock Threshold</Label>
                                    <Input
                                        type="number"
                                        value={formData.low_stock_threshold}
                                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                                        placeholder="10"
                                        className="bg-slate-700 border-slate-600 text-white mt-1"
                                    />
                                </div>
                            </div>

                            {/* Profit Preview */}
                            {formData.cost_price && formData.selling_price && (
                                <div className="p-4 bg-slate-700/50 rounded-lg mt-4">
                                    <p className="text-slate-400 text-sm mb-2">Profit Preview</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-300">Profit per unit:</p>
                                            <p className="text-emerald-400 text-xl font-bold">
                                                {(Number(formData.selling_price) - Number(formData.cost_price)).toFixed(2)} MAD
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-300">Margin:</p>
                                            <p className="text-blue-400 text-xl font-bold">
                                                {((Number(formData.selling_price) - Number(formData.cost_price)) / Number(formData.selling_price) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Toggles */}
                            <div className="space-y-3 pt-4 border-t border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Active</p>
                                        <p className="text-slate-400 text-sm">Product is visible and can be ordered</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-blue-600' : 'bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Featured</p>
                                        <p className="text-slate-400 text-sm">Show in featured products list</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_featured ? 'bg-yellow-600' : 'bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_featured ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
