'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    X,
    Plus,
    Package,
    DollarSign,
    Image as ImageIcon,
    Tag,
    Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateProduct, useCategories } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { Category } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VariationOption {
    type: string;
    values: string[];
    newValue: string;
}

interface GeneratedVariant {
    name: string;
    attributes: Record<string, string>;
}

export default function NewProductPage() {
    const router = useRouter();
    const createProduct = useCreateProduct();
    const { data: categories } = useCategories();

    // Basic product fields
    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [initialStock, setInitialStock] = useState('0');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Variations state
    const [variationOptions, setVariationOptions] = useState<VariationOption[]>([]);
    const [showVariants, setShowVariants] = useState(false);

    const [loading, setLoading] = useState(false);

    // Generate all variant combinations (Cartesian product)
    const generateVariantCombinations = (): GeneratedVariant[] => {
        if (variationOptions.length === 0) return [];

        const optionsWithValues = variationOptions.filter(opt => opt.type && opt.values.length > 0);
        if (optionsWithValues.length === 0) return [];

        const combinations: GeneratedVariant[] = [];

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

    // Calculate profit margin
    const profit = costPrice && sellingPrice ? Number(sellingPrice) - Number(costPrice) : 0;
    const margin = sellingPrice && profit ? (profit / Number(sellingPrice) * 100).toFixed(1) : '0';

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productName || !sku || !sellingPrice) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            // Create product
            const productData = {
                name: productName,
                sku: sku,
                category_id: categoryId ? Number(categoryId) : undefined,
                cost_price: Number(costPrice) || 0,
                selling_price: Number(sellingPrice),
                stock_quantity: variantCombinations.length > 0 ? 0 : Number(initialStock) || 0,
                low_stock_threshold: Number(lowStockThreshold) || 10,
                description: description || undefined,
                image_url: imageUrl || undefined,
            };

            const createdProduct = await createProduct.mutateAsync(productData);

            // Create variants if any
            if (variantCombinations.length > 0 && createdProduct?.id) {
                const token = localStorage.getItem('access_token');
                let variantIndex = 1;

                for (const combo of variantCombinations) {
                    const variantSku = `${sku}-V${variantIndex.toString().padStart(2, '0')}`;
                    await fetch(`${API_URL}/api/v1/products/${createdProduct.id}/variants`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            variant_name: combo.name,
                            sku: variantSku,
                            color: combo.attributes.Color || undefined,
                            size: combo.attributes.Size || undefined,
                            capacity: combo.attributes.Capacity || undefined,
                            stock_quantity: 0,
                        }),
                    });
                    variantIndex++;
                }
            }

            toast.success('Product created successfully!');
            router.push('/products');

        } catch (err: any) {
            toast.error(err.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="text-slate-400 hover:text-white -ml-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Add New Product</h1>
                                <p className="text-sm text-slate-400 hidden sm:block">Create a new product with optional variations</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1 sm:flex-none border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !productName || !sku || !sellingPrice}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Create Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column - Main Form (2 cols on desktop) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Basic Information */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                                        <Package className="w-5 h-5 text-blue-400" />
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-slate-300">Product Name *</Label>
                                        <Input
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="Enter product name"
                                            className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-300">SKU *</Label>
                                            <Input
                                                value={sku}
                                                onChange={(e) => setSku(e.target.value.toUpperCase())}
                                                placeholder="e.g., PROD-001"
                                                className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-slate-300">Category</Label>
                                            <Select value={categoryId} onValueChange={setCategoryId}>
                                                <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                    {(categories || []).map((cat: Category) => (
                                                        <SelectItem key={cat.id} value={cat.id.toString()} className="text-white hover:bg-slate-700">
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-slate-300">Description</Label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Product description..."
                                            className="mt-1.5 bg-slate-900 border-slate-600 text-white min-h-[100px] resize-none"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pricing & Stock */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                                        <DollarSign className="w-5 h-5 text-green-400" />
                                        Pricing & Stock
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-300">Cost Price (MAD)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={costPrice}
                                                onChange={(e) => setCostPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-slate-300">Selling Price (MAD) *</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={sellingPrice}
                                                onChange={(e) => setSellingPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Profit Preview */}
                                    {costPrice && sellingPrice && (
                                        <div className="p-3 sm:p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-xs text-slate-400">Profit per unit</p>
                                                    <p className="text-lg font-bold text-emerald-400">{profit.toFixed(2)} MAD</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400">Margin</p>
                                                    <p className="text-lg font-bold text-blue-400">{margin}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {variantCombinations.length === 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-slate-300">Initial Stock</Label>
                                                <Input
                                                    type="number"
                                                    value={initialStock}
                                                    onChange={(e) => setInitialStock(e.target.value)}
                                                    placeholder="0"
                                                    className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-slate-300">Low Stock Threshold</Label>
                                                <Input
                                                    type="number"
                                                    value={lowStockThreshold}
                                                    onChange={(e) => setLowStockThreshold(e.target.value)}
                                                    placeholder="10"
                                                    className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Product Variations */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                                                <Tag className="w-5 h-5 text-purple-400" />
                                                Variations
                                            </CardTitle>
                                            <p className="text-xs sm:text-sm text-slate-400 mt-1">Define product variants like Color, Size, or Capacity</p>
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
                                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
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
                                            <div key={optIndex} className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                                                <div className="p-3 sm:p-4">
                                                    <div className="flex flex-col sm:flex-row items-start gap-3">
                                                        <div className="flex-1 w-full space-y-3">
                                                            {/* Variation Type */}
                                                            <div>
                                                                <Label className="text-slate-400 text-xs uppercase tracking-wide">Variation Type</Label>
                                                                <Input
                                                                    placeholder="e.g. Color, Size, Capacity, Material"
                                                                    value={option.type}
                                                                    onChange={(e) => {
                                                                        const updated = [...variationOptions];
                                                                        updated[optIndex].type = e.target.value;
                                                                        setVariationOptions(updated);
                                                                    }}
                                                                    className="mt-1.5 bg-slate-800 border-slate-600 text-white h-10"
                                                                />
                                                            </div>

                                                            {/* Variation Values */}
                                                            <div>
                                                                <Label className="text-slate-400 text-xs uppercase tracking-wide">Variation Values</Label>
                                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                                    {option.values.map((val, valIndex) => (
                                                                        <span
                                                                            key={valIndex}
                                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 text-white text-sm rounded-lg border border-slate-600"
                                                                        >
                                                                            {val}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const updated = [...variationOptions];
                                                                                    updated[optIndex].values = updated[optIndex].values.filter((_, i) => i !== valIndex);
                                                                                    setVariationOptions(updated);
                                                                                }}
                                                                                className="text-slate-400 hover:text-red-400"
                                                                            >
                                                                                <X className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                    <div className="flex-1 min-w-[120px]">
                                                                        <Input
                                                                            placeholder={option.values.length === 0
                                                                                ? (option.type.toLowerCase().includes('color') ? 'e.g. Black, White, Red'
                                                                                    : option.type.toLowerCase().includes('size') ? 'e.g. S, M, L, XL'
                                                                                        : 'Add value, press Enter')
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
                                                                            className="bg-transparent border-slate-600 text-white h-9 text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Delete Button */}
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

                                        {/* Add Another Variation */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVariationOptions([...variationOptions, { type: '', values: [], newValue: '' }]);
                                            }}
                                            className="w-full py-3 px-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            + Add Another Variation
                                        </button>

                                        {/* Variant Combinations Preview */}
                                        {variantCombinations.length > 0 && (
                                            <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {variantCombinations.length} variants will be created
                                                            </p>
                                                            <p className="text-xs text-slate-400">Based on your combinations</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        Auto-generated
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                                                    {variantCombinations.slice(0, 12).map((combo, i) => (
                                                        <div
                                                            key={i}
                                                            className="px-3 py-2 bg-slate-800/80 rounded-lg text-sm text-slate-300 truncate border border-slate-700/50"
                                                        >
                                                            {combo.name}
                                                        </div>
                                                    ))}
                                                    {variantCombinations.length > 12 && (
                                                        <div className="px-3 py-2 bg-slate-800/50 rounded-lg text-sm text-slate-500 border border-slate-700/30 flex items-center justify-center">
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

                        {/* Right Column - Image & Summary */}
                        <div className="space-y-6">

                            {/* Product Image */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                                        <ImageIcon className="w-5 h-5 text-yellow-400" />
                                        Product Image
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-slate-300">Image URL</Label>
                                        <Input
                                            type="url"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="mt-1.5 bg-slate-900 border-slate-600 text-white h-11 text-sm"
                                        />
                                    </div>

                                    {/* Image Preview */}
                                    <div className="aspect-square rounded-lg border border-slate-600 overflow-hidden bg-slate-900 flex items-center justify-center">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt="Product preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="text-center text-slate-500">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No image</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Summary Card */}
                            <Card className="bg-slate-800 border-slate-700 lg:sticky lg:top-24">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-white text-base sm:text-lg">Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-slate-400">
                                            <span>Product:</span>
                                            <span className="text-white truncate ml-2 max-w-[150px]">{productName || '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>SKU:</span>
                                            <span className="text-white">{sku || '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Price:</span>
                                            <span className="text-white">{sellingPrice ? `${sellingPrice} MAD` : '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Variants:</span>
                                            <span className="text-white">{variantCombinations.length || 'None'}</span>
                                        </div>
                                    </div>

                                    {/* Mobile Create Button */}
                                    <div className="pt-4 border-t border-slate-700 lg:hidden">
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading || !productName || !sku || !sellingPrice}
                                            className="w-full bg-green-600 hover:bg-green-700 h-12"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Create Product
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
