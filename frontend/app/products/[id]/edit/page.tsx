'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Package, ArrowLeft, Save, RefreshCw, X, Plus, Trash2, Palette, Ruler, Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

    // Smart Variation Options - Each type can have multiple values
    const [variationOptions, setVariationOptions] = useState<{
        type: string;
        values: string[];
        newValue: string;
    }[]>([]);
    const [showVariants, setShowVariants] = useState(false);

    // Predefined variation types with icons
    const variationTypes = [
        { value: 'Color', label: 'Color', icon: Palette },
        { value: 'Size', label: 'Size', icon: Ruler },
        { value: 'Capacity', label: 'Capacity', icon: Box },
        { value: 'Material', label: 'Material', icon: Package },
    ];

    // Generate all variant combinations from the options
    const generateVariantCombinations = () => {
        if (variationOptions.length === 0) return [];

        const optionsWithValues = variationOptions.filter(opt => opt.values.length > 0);
        if (optionsWithValues.length === 0) return [];

        const combinations: { name: string; attributes: Record<string, string> }[] = [];

        const generate = (index: number, current: Record<string, string>) => {
            if (index === optionsWithValues.length) {
                const name = Object.values(current).join(' / ');
                combinations.push({ name, attributes: { ...current } });
                return;
            }

            const option = optionsWithValues[index];
            for (const value of option.values) {
                generate(index + 1, { ...current, [option.type]: value });
            }
        };

        generate(0, {});
        return combinations;
    };

    const variantCombinations = generateVariantCombinations();

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

                    {/* Product Variations */}
                    <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-white">Variations</CardTitle>
                                    <p className="text-sm text-slate-400 font-normal mt-1">Define product variants like Color, Size, or Capacity</p>
                                </div>
                                {!showVariants && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowVariants(true);
                                            if (variationOptions.length === 0) {
                                                setVariationOptions([{ type: '', values: [], newValue: '' }]);
                                            }
                                        }}
                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        + Add Variation
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        {showVariants && (
                            <CardContent className="space-y-4 pt-0">
                                {/* Variation Options */}
                                {variationOptions.map((option, optIndex) => (
                                    <div key={optIndex} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                        <div className="p-3 sm:p-4 border-b border-slate-700/50">
                                            <div className="flex flex-col sm:flex-row items-start gap-3">
                                                <div className="flex-1 w-full space-y-3">
                                                    {/* Variation Type Input */}
                                                    <div>
                                                        <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Variation Type</Label>
                                                        <Input
                                                            placeholder="e.g. Color, Size, Capacity, Material"
                                                            value={option.type}
                                                            onChange={(e) => {
                                                                const updated = [...variationOptions];
                                                                updated[optIndex].type = e.target.value;
                                                                setVariationOptions(updated);
                                                            }}
                                                            className="bg-slate-900 border-slate-600 text-white h-10 focus:border-blue-500 focus:ring-blue-500/20"
                                                        />
                                                    </div>

                                                    {/* Variation Values */}
                                                    <div>
                                                        <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Variation Values</Label>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {option.values.map((val, valIndex) => (
                                                                <span
                                                                    key={valIndex}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-700 text-white text-xs sm:text-sm rounded-lg border border-slate-600 group hover:border-slate-500 transition-colors"
                                                                >
                                                                    {val}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = [...variationOptions];
                                                                            updated[optIndex].values = updated[optIndex].values.filter((_, i) => i !== valIndex);
                                                                            setVariationOptions(updated);
                                                                        }}
                                                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                                                    >
                                                                        <X className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            {/* Inline Add Value Input */}
                                                            <div className="flex-1 min-w-[120px] sm:min-w-[150px]">
                                                                <Input
                                                                    placeholder={option.values.length === 0
                                                                        ? (option.type.toLowerCase().includes('color') ? 'e.g. Black, White, Red'
                                                                            : option.type.toLowerCase().includes('size') ? 'e.g. S, M, L, XL'
                                                                                : 'e.g. Value1, Value2...')
                                                                        : 'Add more...'}
                                                                    value={option.newValue}
                                                                    onChange={(e) => {
                                                                        const updated = [...variationOptions];
                                                                        updated[optIndex].newValue = e.target.value;
                                                                        setVariationOptions(updated);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && option.newValue.trim()) {
                                                                            e.preventDefault();
                                                                            const updated = [...variationOptions];
                                                                            if (!updated[optIndex].values.includes(option.newValue.trim())) {
                                                                                updated[optIndex].values.push(option.newValue.trim());
                                                                            }
                                                                            updated[optIndex].newValue = '';
                                                                            setVariationOptions(updated);
                                                                        }
                                                                    }}
                                                                    className="bg-transparent border-slate-600 text-white h-8 sm:h-9 text-xs sm:text-sm focus:border-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delete Variation Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = variationOptions.filter((_, i) => i !== optIndex);
                                                        setVariationOptions(updated);
                                                        if (updated.length === 0) setShowVariants(false);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Another Variation Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVariationOptions([...variationOptions, { type: '', values: [], newValue: '' }]);
                                    }}
                                    className="w-full py-2.5 sm:py-3 px-3 sm:px-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base"
                                >
                                    <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    + Add Another Variation
                                </button>

                                {/* Variant Combinations Preview */}
                                {variantCombinations.length > 0 && (
                                    <div className="mt-4 p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                    <Package className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {variantCombinations.length} variants will be created
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        Based on your variation combinations
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                Auto-generated
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto">
                                            {variantCombinations.slice(0, 12).map((combo, i) => (
                                                <div
                                                    key={i}
                                                    className="px-3 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-300 truncate border border-slate-600/50"
                                                >
                                                    {combo.name}
                                                </div>
                                            ))}
                                            {variantCombinations.length > 12 && (
                                                <div className="px-3 py-2 bg-slate-700/30 rounded-lg text-sm text-slate-500 border border-slate-600/30 flex items-center justify-center">
                                                    +{variantCombinations.length - 12} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
