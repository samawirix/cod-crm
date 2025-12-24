'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, X, Plus, Package, DollarSign, Tag, Image as ImageIcon, Trash2, Upload, Check, TrendingUp
} from 'lucide-react';
import { VariantOptionEditor, VariantList } from '@/components/products';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VariantOption {
    id: string;
    type: string;
    values: string[];
}

interface GeneratedVariant {
    variant_name: string;
    sku: string;
    color?: string;
    size?: string;
    capacity?: string;
    stock_quantity: number;
    price_override?: number;
}

export default function NewProductPage() {
    const router = useRouter();

    // Basic fields
    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [initialStock, setInitialStock] = useState('0');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Image upload states
    const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreviewError, setImagePreviewError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Variations - using new component state
    const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
    const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formProgress, setFormProgress] = useState(0);

    // Get color code for color swatch
    const getColorCode = (colorName: string): string => {
        const colors: Record<string, string> = {
            'black': '#000000', 'white': '#FFFFFF', 'red': '#EF4444',
            'blue': '#3B82F6', 'green': '#22C55E', 'yellow': '#EAB308',
            'orange': '#F97316', 'purple': '#A855F7', 'pink': '#EC4899',
            'gray': '#6B7280', 'gold': '#F59E0B', 'silver': '#9CA3AF',
            'navy': '#1E3A8A', 'brown': '#92400E',
        };
        return colors[colorName?.toLowerCase()] || '#6B7280';
    };

    // Update summary in real-time
    const [summary, setSummary] = useState({
        name: '-',
        sku: '-',
        price: '-',
        variants: 'None'
    });

    useEffect(() => {
        setSummary({
            name: productName || '-',
            sku: sku || '-',
            price: sellingPrice ? `${sellingPrice} MAD` : '-',
            variants: generatedVariants.length > 0 ? `${generatedVariants.length}` : 'None'
        });
    }, [productName, sku, sellingPrice, generatedVariants]);

    // Calculate form progress
    useEffect(() => {
        let progress = 0;
        if (productName) progress += 25;
        if (sku) progress += 25;
        if (sellingPrice) progress += 25;
        if (costPrice) progress += 15;
        if (imageUrl) progress += 10;
        setFormProgress(Math.min(progress, 100));
    }, [productName, sku, sellingPrice, costPrice, imageUrl]);

    // Generate variants when options change
    useEffect(() => {
        generateVariantsFromOptions(variantOptions);
    }, [variantOptions, sku]);

    const generateVariantsFromOptions = (options: VariantOption[]) => {
        if (options.length === 0 || options.some(o => o.values.length === 0)) {
            setGeneratedVariants([]);
            return;
        }

        const cartesian = (arrays: string[][]): string[][] => {
            return arrays.reduce((acc, array) =>
                acc.flatMap(x => array.map(y => [...x, y])),
                [[]] as string[][]
            );
        };

        const valueArrays = options.map(o => o.values);
        const combinations = cartesian(valueArrays);

        const variants: GeneratedVariant[] = combinations.map(combo => {
            const attributes: Record<string, string> = {};
            options.forEach((opt, i) => {
                attributes[opt.type.toLowerCase()] = combo[i];
            });

            const skuSuffix = combo.map(v => v.toUpperCase().replace(/\s+/g, '-')).join('-');

            return {
                variant_name: combo.join(' / '),
                sku: `${sku || 'PROD'}-${skuSuffix}`,
                color: attributes['color'],
                size: attributes['size'],
                capacity: attributes['capacity'],
                stock_quantity: 0,
                price_override: undefined
            };
        });

        setGeneratedVariants(variants);
    };



    // Update variant
    const updateVariant = (index: number, field: string, value: any) => {
        const updated = [...generatedVariants];
        if (field === 'stock_quantity') {
            updated[index].stock_quantity = parseInt(value) || 0;
        } else if (field === 'price_override') {
            updated[index].price_override = value ? parseFloat(value) : undefined;
        }
        setGeneratedVariants(updated);
    };

    // Delete variant
    const deleteVariant = (index: number) => {
        setGeneratedVariants(generatedVariants.filter((_, i) => i !== index));
    };

    // Image handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            uploadImage(file);
        }
    };

    const uploadImage = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setUploadProgress(10);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('access_token');

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch(`${API_URL}/api/v1/uploads/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            clearInterval(progressInterval);

            if (response.ok) {
                const data = await response.json();
                setImageUrl(`${API_URL}${data.url}`);
                setUploadProgress(100);
                setTimeout(() => setUploadProgress(0), 1000);
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            setUploadProgress(0);
            alert('Failed to upload image. Please try URL instead.');
        }
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');

            const productData = {
                name: productName,
                sku: sku,
                category: category || 'Other',
                cost_price: parseFloat(costPrice) || 0,
                selling_price: parseFloat(sellingPrice),
                stock_quantity: generatedVariants.length > 0 ? 0 : parseInt(initialStock),
                low_stock_threshold: parseInt(lowStockThreshold),
                description: description,
                image_url: imageUrl || null,
                has_variants: generatedVariants.length > 0
            };

            const response = await fetch(`${API_URL}/api/v1/products/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create product');
            }

            const product = await response.json();

            // Create variants
            if (generatedVariants.length > 0) {
                for (const variant of generatedVariants) {
                    await fetch(`${API_URL}/api/v1/products/${product.id}/variants`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(variant)
                    });
                }
            }

            router.push('/products');

        } catch (err: any) {
            setError(err.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Add New Product</h1>
                                <p className="text-gray-400 text-sm">Create a new product with optional variations</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => router.back()} className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                                ) : (
                                    <><Save className="w-4 h-4" />Create Product</>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="mt-4 mb-2">
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Form Progress</span>
                            <span>{formProgress}% Complete</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                                style={{ width: `${formProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT: Form Fields */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Basic Information */}
                            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <Package className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">SKU *</label>
                                            <input
                                                type="text"
                                                value={sku}
                                                onChange={(e) => setSku(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., PROD-001"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select category</option>
                                                <option value="Electronics">Electronics</option>
                                                <option value="Fashion">Fashion</option>
                                                <option value="Beauty">Beauty</option>
                                                <option value="Home">Home & Garden</option>
                                                <option value="Sports">Sports & Outdoors</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Product description..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                    <h2 className="text-lg font-semibold text-white">Pricing & Stock</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Cost Price (MAD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={costPrice}
                                            onChange={(e) => setCostPrice(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Selling Price (MAD) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={sellingPrice}
                                            onChange={(e) => setSellingPrice(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    {generatedVariants.length === 0 && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Stock</label>
                                                <input
                                                    type="number"
                                                    value={initialStock}
                                                    onChange={(e) => setInitialStock(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Alert</label>
                                                <input
                                                    type="number"
                                                    value={lowStockThreshold}
                                                    onChange={(e) => setLowStockThreshold(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {costPrice && sellingPrice && (
                                    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-400">Profit per unit:</p>
                                                <p className="text-2xl font-bold text-green-400">
                                                    {(parseFloat(sellingPrice) - parseFloat(costPrice)).toFixed(2)} MAD
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Margin:</p>
                                                <p className="text-2xl font-bold text-blue-400">
                                                    {parseFloat(sellingPrice) > 0
                                                        ? ((parseFloat(sellingPrice) - parseFloat(costPrice)) / parseFloat(sellingPrice) * 100).toFixed(1)
                                                        : '0'}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Variations - Shopify Style */}
                            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                                <div className="flex items-center gap-2 mb-6">
                                    <Tag className="w-5 h-5 text-purple-400" />
                                    <h2 className="text-lg font-semibold text-white">Product Options</h2>
                                    <span className="text-sm text-gray-400">(Optional)</span>
                                </div>

                                <p className="text-sm text-gray-400 mb-6">
                                    Add options like Color or Size to create product variants. Each combination becomes a separate variant.
                                </p>

                                {/* Option Editor */}
                                <VariantOptionEditor
                                    options={variantOptions}
                                    onChange={setVariantOptions}
                                />

                                {/* Generated Variants */}
                                {generatedVariants.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <VariantList
                                            variants={generatedVariants}
                                            basePrice={parseFloat(sellingPrice) || 0}
                                            baseSku={sku}
                                            onChange={setGeneratedVariants}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Image & Summary */}
                        <div className="space-y-6">

                            {/* Product Image */}
                            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 lg:sticky lg:top-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ImageIcon className="w-5 h-5 text-yellow-400" />
                                    <h2 className="text-lg font-semibold text-white">Product Image</h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Tab Toggle */}
                                    <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setImageInputMode('url')}
                                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${imageInputMode === 'url' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            Image URL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImageInputMode('upload')}
                                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${imageInputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            Upload File
                                        </button>
                                    </div>

                                    {imageInputMode === 'url' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                                            <input
                                                type="url"
                                                value={imageUrl}
                                                onChange={(e) => { setImageUrl(e.target.value); setImagePreviewError(false); }}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    )}

                                    {imageInputMode === 'upload' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Image</label>
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
                                                    }`}
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleFileDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">Drag & drop or click to select</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                                            </div>

                                            {uploadProgress > 0 && uploadProgress < 100 && (
                                                <div className="mt-2">
                                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Image Preview */}
                                    <div className="aspect-square rounded-lg border border-gray-600 overflow-hidden bg-gray-900 flex items-center justify-center">
                                        {imageUrl && !imagePreviewError ? (
                                            <img src={imageUrl} alt="Product preview" className="w-full h-full object-cover" onError={() => setImagePreviewError(true)} />
                                        ) : (
                                            <div className="text-center p-8">
                                                <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">{imagePreviewError ? 'Failed to load image' : 'No image'}</p>
                                            </div>
                                        )}
                                    </div>

                                    {imageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => { setImageUrl(''); setImagePreviewError(false); }}
                                            className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Remove Image
                                        </button>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="mt-6 pt-6 border-t border-gray-700">
                                    <h3 className="text-sm font-semibold text-white mb-3">Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Product:</span>
                                            <span className="text-white font-medium truncate ml-2 max-w-[120px]">{summary.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">SKU:</span>
                                            <span className="text-white">{summary.sku}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Price:</span>
                                            <span className="text-green-400 font-medium">{summary.price}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Variants:</span>
                                            <span className="text-purple-400 font-medium">{summary.variants}</span>
                                        </div>
                                        {generatedVariants.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Total Stock:</span>
                                                <span className="text-blue-400 font-medium">{generatedVariants.reduce((sum, v) => sum + v.stock_quantity, 0)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
