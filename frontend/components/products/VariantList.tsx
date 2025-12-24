'use client';

import { useState } from 'react';
import {
    ChevronDown, ChevronUp, Image as ImageIcon, Trash2,
    GripVertical, Search
} from 'lucide-react';

interface Variant {
    id?: number;
    variant_name: string;
    sku: string;
    color?: string;
    size?: string;
    capacity?: string;
    stock_quantity: number;
    price_override?: number;
    image_url?: string;
    is_active?: boolean;
}

interface Props {
    variants: Variant[];
    basePrice: number;
    baseSku: string;
    onChange: (variants: Variant[]) => void;
    onDelete?: (variantId: number) => void;
    isEditing?: boolean;
}

// Color mapping
const COLOR_MAP: Record<string, string> = {
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
    'navy': '#1E3A8A',
    'brown': '#92400E',
    'beige': '#D4C4A8',
    'teal': '#14B8A6',
    'maroon': '#7F1D1D',
    'olive': '#65A30D',
    'coral': '#F97171',
};

export default function VariantList({
    variants,
    basePrice,
    baseSku,
    onChange,
    onDelete,
    isEditing = false
}: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

    // Get color code
    const getColorCode = (colorName?: string): string => {
        if (!colorName) return '#6B7280';
        return COLOR_MAP[colorName.toLowerCase()] || '#6B7280';
    };

    // Filter variants by search
    const filteredVariants = variants.filter(v =>
        v.variant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Update variant field
    const updateVariant = (index: number, field: string, value: string) => {
        const updated = [...variants];
        if (field === 'stock_quantity') {
            updated[index].stock_quantity = parseInt(value) || 0;
        } else if (field === 'price_override') {
            updated[index].price_override = value ? parseFloat(value) : undefined;
        } else if (field === 'image_url') {
            updated[index].image_url = value;
        }
        onChange(updated);
    };

    // Delete variant
    const deleteVariant = (index: number) => {
        const variant = variants[index];
        if (variant.id && onDelete) {
            onDelete(variant.id);
        } else {
            onChange(variants.filter((_, i) => i !== index));
        }
    };

    // Toggle variant selection
    const toggleSelection = (variantKey: string) => {
        const newSelected = new Set(selectedVariants);
        if (newSelected.has(variantKey)) {
            newSelected.delete(variantKey);
        } else {
            newSelected.add(variantKey);
        }
        setSelectedVariants(newSelected);
    };

    // Select all variants
    const selectAll = () => {
        if (selectedVariants.size === filteredVariants.length) {
            setSelectedVariants(new Set());
        } else {
            setSelectedVariants(new Set(filteredVariants.map((_, i) => i.toString())));
        }
    };

    // Bulk update selected variants
    const bulkUpdateStock = (amount: number) => {
        const updated = variants.map((v, i) => {
            if (selectedVariants.has(i.toString())) {
                return { ...v, stock_quantity: Math.max(0, v.stock_quantity + amount) };
            }
            return v;
        });
        onChange(updated);
    };

    // Calculate totals
    const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    const totalValue = variants.reduce((sum, v) => {
        const price = v.price_override || basePrice;
        return sum + (price * v.stock_quantity);
    }, 0);

    if (variants.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No variants generated yet</p>
                <p className="text-sm mt-1">Add option values above to generate variants</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Stats & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <h3 className="font-medium text-white">
                        {variants.length} Variant{variants.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">
                            Total Stock: <span className="text-blue-400 font-medium">{totalStock}</span>
                        </span>
                        <span className="text-gray-400">
                            Value: <span className="text-green-400 font-medium">{totalValue.toLocaleString()} MAD</span>
                        </span>
                    </div>
                </div>

                {/* Search & Bulk Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search variants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-48"
                        />
                    </div>

                    {selectedVariants.size > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                            <span className="text-sm text-blue-400">{selectedVariants.size} selected</span>
                            <button
                                type="button"
                                onClick={() => bulkUpdateStock(10)}
                                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                                +10 Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedVariants(new Set())}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Variants List */}
            <div className="space-y-2">
                {filteredVariants.map((variant, index) => {
                    const variantKey = index.toString();
                    const isExpanded = expandedId === variantKey;
                    const isSelected = selectedVariants.has(variantKey);
                    const actualPrice = variant.price_override || basePrice;
                    const isLightColor = ['white', 'beige', 'yellow', 'silver'].includes(variant.color?.toLowerCase() || '');

                    return (
                        <div
                            key={variantKey}
                            className={`bg-gray-800/50 rounded-xl border transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-500/5'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            {/* Variant Row */}
                            <div className="flex items-center gap-3 p-4">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelection(variantKey)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                                />

                                {/* Drag Handle */}
                                <div className="cursor-grab text-gray-500 hover:text-gray-400">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Color Swatch or Image */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 flex-shrink-0">
                                    {variant.image_url ? (
                                        <img
                                            src={variant.image_url}
                                            alt={variant.variant_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : variant.color ? (
                                        <div
                                            className="w-full h-full flex items-center justify-center"
                                            style={{ backgroundColor: getColorCode(variant.color) }}
                                        >
                                            {isLightColor && (
                                                <span className="text-xs text-gray-800 font-medium">
                                                    {variant.color.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Variant Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-white truncate">{variant.variant_name}</p>
                                        {variant.size && (
                                            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300 uppercase">
                                                {variant.size}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{variant.sku}</p>
                                </div>

                                {/* Quick Edit Fields */}
                                <div className="flex items-center gap-4">
                                    {/* Stock */}
                                    <div className="w-24">
                                        <label className="text-xs text-gray-500 block mb-1">Stock</label>
                                        <input
                                            type="number"
                                            value={variant.stock_quantity}
                                            onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                                            className={`w-full px-3 py-1.5 bg-gray-900 border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 ${variant.stock_quantity === 0
                                                    ? 'border-red-500/50 text-red-400'
                                                    : 'border-gray-600'
                                                }`}
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="w-28">
                                        <label className="text-xs text-gray-500 block mb-1">Price (MAD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={variant.price_override || ''}
                                            onChange={(e) => updateVariant(index, 'price_override', e.target.value)}
                                            placeholder={basePrice.toString()}
                                            className="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Calculated Value */}
                                    <div className="w-24 text-right hidden sm:block">
                                        <label className="text-xs text-gray-500 block mb-1">Value</label>
                                        <p className="text-sm font-medium text-green-400">
                                            {(actualPrice * variant.stock_quantity).toLocaleString()} MAD
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : variantKey)}
                                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Expand"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteVariant(index)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-700 bg-gray-900/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Variant Image Upload */}
                                        <div>
                                            <label className="text-sm text-gray-400 block mb-2">Variant Image</label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-20 rounded-lg bg-gray-800 border border-gray-600 overflow-hidden">
                                                    {variant.image_url ? (
                                                        <img
                                                            src={variant.image_url}
                                                            alt={variant.variant_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-8 h-8 text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="url"
                                                        value={variant.image_url || ''}
                                                        onChange={(e) => updateVariant(index, 'image_url', e.target.value)}
                                                        placeholder="https://example.com/image.jpg"
                                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Add a specific image for this variant
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Color:</span>
                                                    <span className="text-white ml-2">{variant.color || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Size:</span>
                                                    <span className="text-white ml-2">{variant.size || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Base Price:</span>
                                                    <span className="text-white ml-2">{basePrice} MAD</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Final Price:</span>
                                                    <span className="text-green-400 ml-2 font-medium">{actualPrice} MAD</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedVariants.size === filteredVariants.length && filteredVariants.length > 0}
                        onChange={selectAll}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600"
                    />
                    <span className="text-sm text-gray-400">Select all</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                        Total: <span className="text-white font-medium">{totalStock} items</span>
                    </span>
                    <span className="text-gray-400">
                        Est. Value: <span className="text-green-400 font-medium">{totalValue.toLocaleString()} MAD</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
