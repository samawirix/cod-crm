'use client';

import React, { useState } from 'react';
import {
    Package, Search, Plus, MoreVertical, Edit, Trash2, Eye,
    AlertTriangle, TrendingUp, DollarSign, Boxes, Tag,
    ChevronLeft, ChevronRight, RefreshCw, Star,
    PackagePlus, PackageMinus
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
    // Variants for new product
    const [newVariants, setNewVariants] = useState<{
        variant_name: string;
        sku: string;
        color: string;
        size: string;
        capacity: string;
        image_url: string;
        price_override: string;
        stock_quantity: string;
    }[]>([]);
    const [showVariants, setShowVariants] = useState(false);

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
            await createProduct.mutateAsync({
                name: newProduct.name,
                sku: newProduct.sku,
                description: newProduct.description || undefined,
                category_id: newProduct.category_id ? Number(newProduct.category_id) : undefined,
                cost_price: Number(newProduct.cost_price) || 0,
                selling_price: Number(newProduct.selling_price),
                stock_quantity: Number(newProduct.stock_quantity) || 0,
                low_stock_threshold: Number(newProduct.low_stock_threshold) || 10,
            });
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
            });
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
                        onClick={() => setCreateDialog(true)}
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

                        {/* Variants Section */}
                        <div className="col-span-2 border-t border-slate-700 pt-4 mt-2">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-slate-300 text-base font-semibold">
                                    Product Variations (Colors, Sizes, etc.)
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowVariants(!showVariants)}
                                    className="border-slate-600 text-slate-300"
                                >
                                    {showVariants ? 'Hide Variants' : 'Add Variants'}
                                </Button>
                            </div>

                            {showVariants && (
                                <div className="space-y-3 bg-slate-700/30 p-4 rounded-lg">
                                    {newVariants.map((variant, idx) => (
                                        <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-slate-800 rounded border border-slate-600">
                                            <Input
                                                placeholder="Variant Name (e.g., Black)"
                                                value={variant.variant_name}
                                                onChange={(e) => {
                                                    const updated = [...newVariants];
                                                    updated[idx].variant_name = e.target.value;
                                                    setNewVariants(updated);
                                                }}
                                                className="bg-slate-700 border-slate-600 text-white text-sm"
                                            />
                                            <Input
                                                placeholder="SKU (e.g., PROD-BLK)"
                                                value={variant.sku}
                                                onChange={(e) => {
                                                    const updated = [...newVariants];
                                                    updated[idx].sku = e.target.value.toUpperCase();
                                                    setNewVariants(updated);
                                                }}
                                                className="bg-slate-700 border-slate-600 text-white text-sm"
                                            />
                                            <Input
                                                placeholder="Price Override"
                                                type="number"
                                                value={variant.price_override}
                                                onChange={(e) => {
                                                    const updated = [...newVariants];
                                                    updated[idx].price_override = e.target.value;
                                                    setNewVariants(updated);
                                                }}
                                                className="bg-slate-700 border-slate-600 text-white text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Stock"
                                                    type="number"
                                                    value={variant.stock_quantity}
                                                    onChange={(e) => {
                                                        const updated = [...newVariants];
                                                        updated[idx].stock_quantity = e.target.value;
                                                        setNewVariants(updated);
                                                    }}
                                                    className="bg-slate-700 border-slate-600 text-white text-sm flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setNewVariants(newVariants.filter((_, i) => i !== idx));
                                                    }}
                                                    className="text-red-400 hover:text-red-300 px-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNewVariants([...newVariants, {
                                            variant_name: '',
                                            sku: '',
                                            color: '',
                                            size: '',
                                            capacity: '',
                                            image_url: '',
                                            price_override: '',
                                            stock_quantity: ''
                                        }])}
                                        className="w-full border-dashed border-slate-500 text-slate-400"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Another Variant
                                    </Button>

                                    <p className="text-xs text-slate-400">
                                        Variants will be created after the product is added. You can manage them from the product details page.
                                    </p>
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
                </DialogContent>
            </Dialog>

            {/* Adjust Stock Dialog */}
            <Dialog open={stockDialog.open} onOpenChange={(open) => setStockDialog({ open, product: open ? stockDialog.product : null })}>
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
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: open ? deleteDialog.product : null })}>
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
            </Dialog>
        </div>
    );
}
