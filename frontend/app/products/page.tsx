'use client';

import React, { useState } from 'react';
import {
    Package, Search, Plus, MoreVertical, Edit, Trash2, Eye,
    AlertTriangle, TrendingUp, DollarSign, Boxes, Tag,
    ChevronLeft, ChevronRight, RefreshCw, Star,
    PackagePlus, PackageMinus, X, Palette, Ruler, Box
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import {
    useProducts,
    useCategories,
    useInventoryStats,
    useCreateProduct,
    useDeleteProduct,
    useAdjustStock
} from '@/hooks/useProducts';
import { Product, Category } from '@/lib/api';

const getStockBadge = (product: Product) => {
    if (product.is_out_of_stock) {
        return <Badge className="bg-red-600 text-white">Out of Stock</Badge>;
    }
    if (product.is_low_stock) {
        return <Badge className="bg-orange-600 text-white">Low Stock</Badge>;
    }
    return <Badge className="bg-green-600 text-white">In Stock</Badge>;
};

export default function ProductsPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');

    // Dialogs
    const [createDialog, setCreateDialog] = useState(false);
    const [stockDialog, setStockDialog] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });

    // Form states
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        low_stock_threshold: '10',
        image_url: '',
    });
    // Smart Variation Options - Each type can have multiple values
    // Example: { type: 'Color', values: ['Black', 'White', 'Red'] }
    const [variationOptions, setVariationOptions] = useState<{
        type: string;
        values: string[];
        newValue: string; // temp input for adding new value
    }[]>([]);
    const [showVariants, setShowVariants] = useState(false);

    // Predefined variation types with icons
    const variationTypes = [
        { value: 'Color', label: 'Color', icon: Palette },
        { value: 'Size', label: 'Size', icon: Ruler },
        { value: 'Capacity', label: 'Capacity', icon: Box },
        { value: 'Material', label: 'Material', icon: Package },
        { value: 'Style', label: 'Style', icon: Tag },
    ];

    // Generate all variant combinations from the options
    const generateVariantCombinations = () => {
        if (variationOptions.length === 0) return [];

        const optionsWithValues = variationOptions.filter(opt => opt.values.length > 0);
        if (optionsWithValues.length === 0) return [];

        // Generate cartesian product of all options
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

    const [stockAdjustment, setStockAdjustment] = useState({
        quantity: '',
        reason: '',
        notes: '',
    });

    // Queries
    const { data: productsData, isLoading, refetch } = useProducts({
        page,
        page_size: 20,
        search: search || undefined,
        category_id: categoryFilter !== 'all' ? Number(categoryFilter) : undefined,
        low_stock_only: stockFilter === 'low',
        out_of_stock_only: stockFilter === 'out',
    });

    const { data: categories } = useCategories();
    const { data: stats } = useInventoryStats();

    // Mutations
    const createProduct = useCreateProduct();
    const deleteProduct = useDeleteProduct();
    const adjustStock = useAdjustStock();

    const handleCreateProduct = async () => {
        if (!newProduct.name || !newProduct.sku || !newProduct.selling_price) return;

        try {
            // Create the product first
            const createdProduct = await createProduct.mutateAsync({
                name: newProduct.name,
                sku: newProduct.sku,
                description: newProduct.description || undefined,
                category_id: newProduct.category_id ? Number(newProduct.category_id) : undefined,
                cost_price: Number(newProduct.cost_price) || 0,
                selling_price: Number(newProduct.selling_price),
                stock_quantity: Number(newProduct.stock_quantity) || 0,
                low_stock_threshold: Number(newProduct.low_stock_threshold) || 10,
                image_url: newProduct.image_url || undefined,
            });

            // If there are variant combinations, create them
            if (variantCombinations.length > 0 && createdProduct?.id) {
                const token = localStorage.getItem('access_token');
                let variantIndex = 1;
                for (const combo of variantCombinations) {
                    const variantSku = `${newProduct.sku}-V${variantIndex.toString().padStart(2, '0')}`;
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/products/${createdProduct.id}/variants`, {
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

            setCreateDialog(false);
            setNewProduct({
                name: '',
                sku: '',
                description: '',
                category_id: '',
                cost_price: '',
                selling_price: '',
                stock_quantity: '',
                low_stock_threshold: '10',
                image_url: '',
            });
            setVariationOptions([]);
            setShowVariants(false);
        } catch (error) {
            console.error('Failed to create product:', error);
        }
    };

    const handleAdjustStock = async () => {
        if (!stockDialog.product || !stockAdjustment.quantity || !stockAdjustment.reason) return;

        try {
            await adjustStock.mutateAsync({
                productId: stockDialog.product.id,
                data: {
                    quantity: Number(stockAdjustment.quantity),
                    reason: stockAdjustment.reason,
                    notes: stockAdjustment.notes || undefined,
                },
            });
            setStockDialog({ open: false, product: null });
            setStockAdjustment({ quantity: '', reason: '', notes: '' });
        } catch (error) {
            console.error('Failed to adjust stock:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.product) return;

        try {
            await deleteProduct.mutateAsync(deleteDialog.product.id);
            setDeleteDialog({ open: false, product: null });
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    const products = productsData?.products || [];
    const totalPages = productsData?.total_pages || 1;

    // KPI Card Component
    const KPICard = ({ title, value, subtitle, icon: Icon, color }: {
        title: string;
        value: string | number;
        subtitle?: string;
        icon: React.ElementType;
        color?: string;
    }) => (
        <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400">{title}</p>
                        <p className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</p>
                        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    <Icon className={`h-8 w-8 ${color || 'text-slate-400'} opacity-50`} />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Boxes className="h-7 w-7" />
                        Inventory Management
                    </h1>
                    <p className="text-slate-400">Manage products and stock levels</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => router.push('/products/new')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <KPICard
                    title="Total Products"
                    value={stats?.total_products || 0}
                    icon={Package}
                    color="text-blue-500"
                />
                <KPICard
                    title="Categories"
                    value={stats?.categories_count || 0}
                    icon={Tag}
                    color="text-purple-500"
                />
                <KPICard
                    title="Low Stock"
                    value={stats?.low_stock || 0}
                    icon={AlertTriangle}
                    color="text-orange-500"
                />
                <KPICard
                    title="Out of Stock"
                    value={stats?.out_of_stock || 0}
                    icon={PackageMinus}
                    color="text-red-500"
                />
                <KPICard
                    title="Stock Value"
                    value={`${((stats?.total_stock_value || 0) / 1000).toFixed(1)}K`}
                    subtitle={`${(stats?.total_stock_value || 0).toLocaleString()} MAD`}
                    icon={DollarSign}
                    color="text-emerald-500"
                />
                <KPICard
                    title="Potential Profit"
                    value={`${((stats?.potential_profit || 0) / 1000).toFixed(1)}K`}
                    subtitle={`${(stats?.potential_profit || 0).toLocaleString()} MAD`}
                    icon={TrendingUp}
                    color="text-green-500"
                />
            </div>

            {/* Filters */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search products, SKU, description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all" className="text-white">All Categories</SelectItem>
                                {(categories || []).map((cat: Category) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()} className="text-white">
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={stockFilter} onValueChange={setStockFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Stock Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all" className="text-white">All Stock</SelectItem>
                                <SelectItem value="low" className="text-white">Low Stock</SelectItem>
                                <SelectItem value="out" className="text-white">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                    <th className="p-4">Product</th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4">Margin</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400">
                                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product: Product) => (
                                        <tr
                                            key={product.id}
                                            className="text-white border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                                            onClick={() => router.push(`/products/${product.id}`)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium flex items-center gap-2">
                                                            {product.name}
                                                            {product.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                                        </p>
                                                        {product.short_description && (
                                                            <p className="text-sm text-slate-400 truncate max-w-[200px]">{product.short_description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-slate-300">{product.sku}</span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="border-slate-600 text-slate-300">
                                                    {product.category_name || 'Uncategorized'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-semibold text-emerald-400">
                                                    {product.selling_price.toLocaleString()} MAD
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400">
                                                {product.cost_price.toLocaleString()} MAD
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-medium ${product.profit_margin >= 30 ? 'text-green-400' : product.profit_margin >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {product.profit_margin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-semibold ${product.is_out_of_stock ? 'text-red-400' : product.is_low_stock ? 'text-orange-400' : 'text-white'}`}>
                                                    {product.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {getStockBadge(product)}
                                            </td>
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-slate-700"
                                                            onClick={() => router.push(`/products/${product.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-blue-400 hover:bg-slate-700"
                                                            onClick={() => setStockDialog({ open: true, product })}
                                                        >
                                                            <PackagePlus className="h-4 w-4 mr-2" />
                                                            Adjust Stock
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-slate-700"
                                                            onClick={() => router.push(`/products/${product.id}/edit`)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Product
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-700" />
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:bg-slate-700"
                                                            onClick={() => setDeleteDialog({ open: true, product })}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-700">
                            <p className="text-sm text-slate-400">
                                Page {page} of {totalPages} ({productsData?.total || 0} products)
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="border-slate-700"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="border-slate-700"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Product Dialog */}
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label className="text-slate-300">Product Name *</Label>
                            <Input
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                placeholder="Enter product name"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">SKU *</Label>
                            <Input
                                value={newProduct.sku}
                                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                                placeholder="e.g., PROD-001"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Category</Label>
                            <Select
                                value={newProduct.category_id}
                                onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
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
                            <Label className="text-slate-300">Cost Price (MAD)</Label>
                            <Input
                                type="number"
                                value={newProduct.cost_price}
                                onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                                placeholder="0"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Selling Price (MAD) *</Label>
                            <Input
                                type="number"
                                value={newProduct.selling_price}
                                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                                placeholder="0"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Initial Stock</Label>
                            <Input
                                type="number"
                                value={newProduct.stock_quantity}
                                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                                placeholder="0"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Low Stock Threshold</Label>
                            <Input
                                type="number"
                                value={newProduct.low_stock_threshold}
                                onChange={(e) => setNewProduct({ ...newProduct, low_stock_threshold: e.target.value })}
                                placeholder="10"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-slate-300">Description</Label>
                            <Textarea
                                value={newProduct.description}
                                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                placeholder="Product description..."
                                className="bg-slate-700 border-slate-600 text-white min-h-[80px] mt-1"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="col-span-2">
                            <Label className="text-slate-300">Image URL</Label>
                            <Input
                                value={newProduct.image_url}
                                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>

                        {/* Product Variations Section */}
                        <div className="col-span-2 border-t border-slate-700 pt-4 mt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <div>
                                    <Label className="text-white text-base font-semibold">Variations</Label>
                                    <p className="text-xs text-slate-400 mt-0.5">Define product variants like Color, Size, or Capacity</p>
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

                            {showVariants && (
                                <div className="space-y-4">
                                    {/* Variation Options */}
                                    {variationOptions.map((option, optIndex) => (
                                        <div key={optIndex} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                            {/* Variation Header */}
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

                                                    {/* Delete Option Button */}
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

                                    {/* Add Another Option Button */}
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
                                                            Based on your option combinations
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    Auto-generated
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
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
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-slate-600">Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleCreateProduct}
                            disabled={!newProduct.name || !newProduct.sku || !newProduct.selling_price || createProduct.isPending}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {createProduct.isPending ? 'Creating...' : 'Create Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >

            {/* Adjust Stock Dialog */}
            < Dialog open={stockDialog.open} onOpenChange={(open) => setStockDialog({ open, product: open ? stockDialog.product : null })
            }>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Adjust Stock: {stockDialog.product?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-slate-700/50 p-4 rounded-lg">
                            <p className="text-slate-400 text-sm">Current Stock</p>
                            <p className="text-2xl font-bold text-white">{stockDialog.product?.stock_quantity} units</p>
                        </div>
                        <div>
                            <Label className="text-slate-300">Quantity Change *</Label>
                            <Input
                                type="number"
                                value={stockAdjustment.quantity}
                                onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                                placeholder="e.g., 10 or -5"
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                            <p className="text-xs text-slate-400 mt-1">Use positive for adding, negative for removing</p>
                        </div>
                        <div>
                            <Label className="text-slate-300">Reason *</Label>
                            <Select
                                value={stockAdjustment.reason}
                                onValueChange={(value) => setStockAdjustment({ ...stockAdjustment, reason: value })}
                            >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="Restock" className="text-white">Restock</SelectItem>
                                    <SelectItem value="Inventory Count" className="text-white">Inventory Count</SelectItem>
                                    <SelectItem value="Damaged" className="text-white">Damaged</SelectItem>
                                    <SelectItem value="Lost" className="text-white">Lost</SelectItem>
                                    <SelectItem value="Return" className="text-white">Return</SelectItem>
                                    <SelectItem value="Other" className="text-white">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-slate-300">Notes</Label>
                            <Textarea
                                value={stockAdjustment.notes}
                                onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                                placeholder="Additional notes..."
                                className="bg-slate-700 border-slate-600 text-white mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStockDialog({ open: false, product: null })} className="border-slate-600">
                            Cancel
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleAdjustStock}
                            disabled={!stockAdjustment.quantity || !stockAdjustment.reason || adjustStock.isPending}
                        >
                            <PackagePlus className="h-4 w-4 mr-2" />
                            {adjustStock.isPending ? 'Adjusting...' : 'Adjust Stock'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Delete Confirmation Dialog */}
            < Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: open ? deleteDialog.product : null })}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                    </DialogHeader>
                    <p className="text-slate-300">
                        Are you sure you want to delete <strong>{deleteDialog.product?.name}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, product: null })} className="border-slate-600">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteProduct.isPending}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteProduct.isPending ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}
