'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, X, Plus, Package, DollarSign, Tag, Image as ImageIcon, Trash2
} from 'lucide-react';

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

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [imagePreviewError, setImagePreviewError] = useState(false);

    // Load product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const token = localStorage.getItem('access_token');

                // Fetch product
                const productRes = await fetch(`${API_URL}/api/v1/products/${productId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!productRes.ok) throw new Error('Failed to load product');

                const productData = await productRes.json();
                setProduct(productData);

                // Set form fields
                setProductName(productData.name);
                setSku(productData.sku);
                setCategory(productData.category || '');
                setCostPrice(productData.cost_price?.toString() || '');
                setSellingPrice(productData.selling_price?.toString() || '');
                setStock(productData.stock_quantity?.toString() || '0');
                setLowStockThreshold(productData.low_stock_threshold?.toString() || '10');
                setDescription(productData.description || '');
                setImageUrl(productData.image_url || '');

                // Fetch variants if product has them
                if (productData.has_variants || productData.variants?.length > 0) {
                    const variantsRes = await fetch(`${API_URL}/api/v1/products/${productId}/variants`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (variantsRes.ok) {
                        const variantsData = await variantsRes.json();
                        setVariants(variantsData);
                    }
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    // Update variant locally
    const updateVariant = (index: number, field: string, value: any) => {
        const updated = [...variants];
        if (field === 'stock_quantity') {
            updated[index].stock_quantity = parseInt(value) || 0;
        } else if (field === 'price_override') {
            updated[index].price_override = value ? parseFloat(value) : undefined;
        }
        setVariants(updated);
    };

    // Delete variant
    const deleteVariant = async (variantId: number) => {
        if (!confirm('Are you sure you want to delete this variant?')) return;

        try {
            const token = localStorage.getItem('access_token');

            const response = await fetch(`${API_URL}/api/v1/products/variants/${variantId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setVariants(variants.filter(v => v.id !== variantId));
            } else {
                alert('Failed to delete variant');
            }
        } catch (err) {
            alert('Error deleting variant');
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

            // Update variants
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
                    <button
                        onClick={() => router.push('/products')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    const hasVariants = variants.length > 0;

    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Product</h1>
                                <p className="text-gray-400 text-sm">{product.name}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Product Name *
                                    </label>
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
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            SKU *
                                        </label>
                                        <input
                                            type="text"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Category
                                        </label>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Cost Price (MAD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Selling Price (MAD) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={sellingPrice}
                                        onChange={(e) => setSellingPrice(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {!hasVariants && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Stock Quantity
                                            </label>
                                            <input
                                                type="number"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Low Stock Alert
                                            </label>
                                            <input
                                                type="number"
                                                value={lowStockThreshold}
                                                onChange={(e) => setLowStockThreshold(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profit Preview */}
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

                        {/* Variants Management */}
                        {hasVariants && (
                            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag className="w-5 h-5 text-purple-400" />
                                    <h2 className="text-lg font-semibold text-white">Product Variants</h2>
                                    <span className="text-sm text-gray-400">({variants.length} variants)</span>
                                </div>

                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {variants.map((variant, index) => (
                                        <div
                                            key={variant.id}
                                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white">{variant.variant_name}</p>
                                                <p className="text-xs text-gray-500">{variant.sku}</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {variant.color && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">Color: {variant.color}</span>
                                                    )}
                                                    {variant.size && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">Size: {variant.size}</span>
                                                    )}
                                                    {variant.capacity && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">Capacity: {variant.capacity}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-24">
                                                    <label className="text-xs text-gray-400 mb-1 block">Stock</label>
                                                    <input
                                                        type="number"
                                                        value={variant.stock_quantity}
                                                        onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div className="w-24">
                                                    <label className="text-xs text-gray-400 mb-1 block">Price</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.price_override || ''}
                                                        onChange={(e) => updateVariant(index, 'price_override', e.target.value)}
                                                        placeholder={sellingPrice}
                                                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteVariant(variant.id)}
                                                    className="p-2 hover:bg-red-600/20 rounded transition-colors mt-5"
                                                    title="Delete variant"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Stock Summary */}
                                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <span className="text-sm text-blue-400">Total Stock Across All Variants:</span>
                                    <span className="text-lg font-bold text-blue-400">
                                        {variants.reduce((sum, v) => sum + v.stock_quantity, 0)} units
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Image */}
                    <div>
                        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 lg:sticky lg:top-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ImageIcon className="w-5 h-5 text-yellow-400" />
                                <h2 className="text-lg font-semibold text-white">Product Image</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => {
                                            setImageUrl(e.target.value);
                                            setImagePreviewError(false);
                                        }}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                {/* Image Preview */}
                                <div className="aspect-square rounded-lg border border-gray-600 overflow-hidden bg-gray-900 flex items-center justify-center">
                                    {imageUrl && !imagePreviewError ? (
                                        <img
                                            src={imageUrl}
                                            alt="Product"
                                            className="w-full h-full object-cover"
                                            onError={() => setImagePreviewError(true)}
                                        />
                                    ) : (
                                        <div className="text-center p-8">
                                            <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">
                                                {imagePreviewError ? 'Failed to load image' : 'No image'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {imageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageUrl('');
                                            setImagePreviewError(false);
                                        }}
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
                                    {hasVariants && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Variants:</span>
                                                <span className="text-purple-400 font-medium">{variants.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Total Stock:</span>
                                                <span className="text-blue-400 font-medium">
                                                    {variants.reduce((sum, v) => sum + v.stock_quantity, 0)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {!hasVariants && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Stock:</span>
                                            <span className="text-blue-400 font-medium">{stock}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Save Button */}
                            <div className="mt-6 lg:hidden">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
