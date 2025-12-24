'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, X, Plus, Package, DollarSign, Tag, Image as ImageIcon, Trash2, Upload, Check, TrendingUp
} from 'lucide-react';
import { VariantOptionEditor, VariantList } from '@/components/products';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Product {
    id: number;
    name: string;
    sku: string;
    category?: string;
    category_id?: number;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    description?: string;
    image_url?: string;
    has_variants?: boolean;
}

interface Variant {
    id: number;
    variant_name: string;
    sku: string;
    color?: string;
    size?: string;
    capacity?: string;
    stock_quantity: number;
    price_override?: number;
    actual_price?: number;
    is_active: boolean;
}

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

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<Variant[]>([]);

    // Form fields
    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [stock, setStock] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Image upload states
    const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreviewError, setImagePreviewError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New variants states - updated for new components
    const [pendingVariantOptions, setPendingVariantOptions] = useState<VariantOption[]>([]);
    const [newGeneratedVariants, setNewGeneratedVariants] = useState<GeneratedVariant[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const token = localStorage.getItem('access_token');

                const productRes = await fetch(`${API_URL}/api/v1/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!productRes.ok) throw new Error('Failed to load product');

                const productData = await productRes.json();
                setProduct(productData);

                setProductName(productData.name);
                setSku(productData.sku);
                setCategory(productData.category || '');
                setCostPrice(productData.cost_price?.toString() || '');
                setSellingPrice(productData.selling_price?.toString() || '');
                setStock(productData.stock_quantity?.toString() || '0');
                setLowStockThreshold(productData.low_stock_threshold?.toString() || '10');
                setDescription(productData.description || '');
                setImageUrl(productData.image_url || '');

                // Fetch variants
                const variantsRes = await fetch(`${API_URL}/api/v1/products/${productId}/variants`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (variantsRes.ok) {
                    const variantsData = await variantsRes.json();
                    setVariants(variantsData);
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    // Update existing variant field
    const updateVariantField = (index: number, field: string, value: any) => {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        setVariants(updated);
    };

    // Delete existing variant
    const handleDeleteVariant = async (variantId: number) => {
        if (!confirm('Delete this variant?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/api/v1/products/variants/${variantId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setVariants(variants.filter(v => v.id !== variantId));
            }
        } catch (err) {
            console.error('Failed to delete variant');
        }
    };

    // Generate new variants when options change
    useEffect(() => {
        generateNewVariantsFromOptions(pendingVariantOptions);
    }, [pendingVariantOptions, sku]);

    const generateNewVariantsFromOptions = (options: VariantOption[]) => {
        if (options.length === 0 || options.some(o => o.values.length === 0)) {
            setNewGeneratedVariants([]);
            return;
        }

        const cartesian = (arrays: string[][]): string[][] => {
            return arrays.reduce((acc, array) =>
                acc.flatMap(x => array.map(y => [...x, y])),
                [[]] as string[][]
            );
        };

        const combinations = cartesian(options.map(o => o.values));
        const newVariants = combinations.map(combo => {
            const attributes: Record<string, string> = {};
            options.forEach((opt, i) => {
                attributes[opt.type.toLowerCase()] = combo[i];
            });

            return {
                variant_name: combo.join(' / '),
                sku: `${sku}-${combo.map(v => v.toUpperCase().replace(/\s+/g, '-')).join('-')}`,
                color: attributes['color'],
                size: attributes['size'],
                capacity: attributes['capacity'],
                stock_quantity: 0,
                price_override: undefined
            };
        });

        setNewGeneratedVariants(newVariants);
    };



    // Update new variant field
    const updateNewVariant = (index: number, field: string, value: any) => {
        const updated = [...newGeneratedVariants];
        if (field === 'stock_quantity') {
            updated[index].stock_quantity = parseInt(value) || 0;
        } else if (field === 'price_override') {
            updated[index].price_override = value ? parseFloat(value) : undefined;
        }
        setNewGeneratedVariants(updated);
    };

    // Remove a single new variant
    const removeNewVariant = (index: number) => {
        setNewGeneratedVariants(newGeneratedVariants.filter((_, i) => i !== index));
    };

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

    // Track unsaved changes
    useEffect(() => {
        if (product) {
            const hasChanges =
                productName !== product.name ||
                sku !== product.sku ||
                costPrice !== String(product.cost_price || '') ||
                sellingPrice !== String(product.selling_price || '') ||
                newGeneratedVariants.length > 0;
            setHasUnsavedChanges(hasChanges);
        }
    }, [productName, sku, costPrice, sellingPrice, newGeneratedVariants, product]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'Escape') {
                router.back();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

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

    // Save changes
    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');

            // Update product
            const productData = {
                name: productName,
                sku: sku,
                category: category || 'Other',
                cost_price: parseFloat(costPrice) || 0,
                selling_price: parseFloat(sellingPrice),
                stock_quantity: variants.length > 0 ? 0 : parseInt(stock),
                low_stock_threshold: parseInt(lowStockThreshold) || 10,
                description: description,
                image_url: imageUrl || null
            };

            const productRes = await fetch(`${API_URL}/api/v1/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!productRes.ok) throw new Error('Failed to update product');

            // Update existing variants
            for (const variant of variants) {
                await fetch(`${API_URL}/api/v1/products/variants/${variant.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        variant_name: variant.variant_name,
                        sku: variant.sku,
                        color: variant.color,
                        size: variant.size,
                        capacity: variant.capacity,
                        stock_quantity: variant.stock_quantity,
                        price_override: variant.price_override,
                        is_active: variant.is_active
                    })
                });
            }

            // Create new variants
            if (newGeneratedVariants.length > 0) {
                for (const variant of newGeneratedVariants) {
                    await fetch(`${API_URL}/api/v1/products/${productId}/variants`, {
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
            setError(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading product...
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4">Product not found</p>
                    <button onClick={() => router.push('/products')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

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
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Product</h1>
                                    {hasUnsavedChanges && (
                                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                            Unsaved
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">{product.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                                <kbd className="px-2 py-1 bg-gray-700 rounded">⌘S</kbd>
                                <span>Save</span>
                                <kbd className="px-2 py-1 bg-gray-700 rounded ml-2">Esc</kbd>
                                <span>Cancel</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => router.back()} className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                                    ) : (
                                        <><Save className="w-4 h-4" />Save Changes</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}
                    </div>

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
                                            required
                                        />
                                    </div>

                                    {variants.length === 0 && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Stock Quantity</label>
                                                <input
                                                    type="number"
                                                    value={stock}
                                                    onChange={(e) => setStock(e.target.value)}
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

                            {/* Existing Variants Management */}
                            {variants.length > 0 && (
                                <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-5 h-5 text-purple-400" />
                                            <h2 className="text-lg font-semibold text-white">Existing Variants</h2>
                                            <span className="text-sm text-gray-400">({variants.length})</span>
                                        </div>
                                        <span className="text-sm text-blue-400">
                                            Total Stock: {variants.reduce((sum, v) => sum + v.stock_quantity, 0)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {variants.map((variant, index) => (
                                            <div key={variant.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{variant.variant_name}</p>
                                                    <p className="text-xs text-gray-500">{variant.sku}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="w-24">
                                                        <label className="text-xs text-gray-400 block mb-1">Stock</label>
                                                        <input
                                                            type="number"
                                                            value={variant.stock_quantity}
                                                            onChange={(e) => updateVariantField(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                                                        />
                                                    </div>

                                                    <div className="w-28">
                                                        <label className="text-xs text-gray-400 block mb-1">Price Override</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={variant.price_override || ''}
                                                            onChange={(e) => updateVariantField(index, 'price_override', e.target.value ? parseFloat(e.target.value) : null)}
                                                            placeholder={sellingPrice}
                                                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteVariant(variant.id)}
                                                        className="p-2 hover:bg-red-500/20 rounded transition-colors mt-5"
                                                        title="Delete variant"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add New Variants - Shopify Style */}
                            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                                <div className="flex items-center gap-2 mb-6">
                                    <Plus className="w-5 h-5 text-green-400" />
                                    <h2 className="text-lg font-semibold text-white">Add New Options</h2>
                                    <span className="text-sm text-gray-400">(Optional)</span>
                                </div>

                                <p className="text-sm text-gray-400 mb-6">
                                    Add new options like Color or Size to create additional variants for this product.
                                </p>

                                {/* Option Editor */}
                                <VariantOptionEditor
                                    options={pendingVariantOptions}
                                    onChange={setPendingVariantOptions}
                                />

                                {/* Generated Variants */}
                                {newGeneratedVariants.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-sm font-medium text-green-400">
                                                Will create {newGeneratedVariants.length} new variant(s)
                                            </span>
                                        </div>
                                        <VariantList
                                            variants={newGeneratedVariants}
                                            basePrice={parseFloat(sellingPrice) || 0}
                                            baseSku={sku}
                                            onChange={setNewGeneratedVariants}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Image */}
                        <div>
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
                                            <img src={imageUrl} alt="Product" className="w-full h-full object-cover" onError={() => setImagePreviewError(true)} />
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

                                {/* Product Summary */}
                                <div className="mt-6 pt-6 border-t border-gray-700">
                                    <h3 className="text-sm font-semibold text-white mb-3">Product Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Product ID:</span>
                                            <span className="text-white">#{product.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">SKU:</span>
                                            <span className="text-white">{sku}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Price:</span>
                                            <span className="text-green-400 font-medium">{sellingPrice ? `${sellingPrice} MAD` : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Existing Variants:</span>
                                            <span className="text-purple-400 font-medium">{variants.length}</span>
                                        </div>
                                        {newGeneratedVariants.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">New Variants:</span>
                                                <span className="text-green-400 font-medium">+{newGeneratedVariants.length}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total Stock:</span>
                                            <span className="text-blue-400 font-medium">
                                                {variants.reduce((sum, v) => sum + v.stock_quantity, 0) + newGeneratedVariants.reduce((sum, v) => sum + v.stock_quantity, 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
