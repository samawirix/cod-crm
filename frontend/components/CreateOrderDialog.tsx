'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Minus, Trash2, Search, Package, ShoppingCart,
    X, Check, AlertCircle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { useAvailableProducts, useCreateOrderWithItems } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useProducts';
import { Product, Category } from '@/lib/api';

interface CartItem {
    product: Product;
    quantity: number;
    discount: number;
}

interface CreateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: number;
    leadName: string;
    leadPhone: string;
    leadAddress?: string;
    leadCity?: string;
    onSuccess?: () => void;
}

export default function CreateOrderDialog({
    open,
    onOpenChange,
    leadId,
    leadName,
    leadPhone,
    leadAddress = '',
    leadCity = '',
    onSuccess
}: CreateOrderDialogProps) {
    // State
    const [step, setStep] = useState(1); // 1: Products, 2: Shipping, 3: Review
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [shippingAddress, setShippingAddress] = useState(leadAddress);
    const [shippingCity, setShippingCity] = useState(leadCity);
    const [shippingRegion, setShippingRegion] = useState('');
    const [shippingCost, setShippingCost] = useState('30');
    const [orderDiscount, setOrderDiscount] = useState('0');
    const [orderNotes, setOrderNotes] = useState('');
    const [error, setError] = useState('');

    // Queries
    const { data: productsData, isLoading: productsLoading } = useAvailableProducts(
        search || undefined,
        categoryFilter !== 'all' ? Number(categoryFilter) : undefined
    );
    const { data: categories } = useCategories();
    const createOrder = useCreateOrderWithItems();

    const products = productsData?.products || [];

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            setStep(1);
            setCart([]);
            setShippingAddress(leadAddress);
            setShippingCity(leadCity);
            setShippingRegion('');
            setShippingCost('30');
            setOrderDiscount('0');
            setOrderNotes('');
            setError('');
        }
    }, [open, leadAddress, leadCity]);

    // Cart functions
    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1, discount: 0 }]);
        }
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(cart.map(item =>
            item.product.id === productId
                ? { ...item, quantity }
                : item
        ));
    };

    // Calculate totals
    const itemsSubtotal = cart.reduce((sum, item) =>
        sum + (item.product.selling_price * item.quantity) - item.discount, 0
    );
    const shipping = Number(shippingCost) || 0;
    const discount = Number(orderDiscount) || 0;
    const total = itemsSubtotal + shipping - discount;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Submit order
    const handleSubmit = async () => {
        if (cart.length === 0) {
            setError('Please add at least one product');
            return;
        }
        if (!shippingAddress || !shippingCity) {
            setError('Please fill in shipping address and city');
            return;
        }

        try {
            const orderData = {
                lead_id: leadId,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    discount: item.discount
                })),
                shipping_cost: shipping,
                discount: discount,
                shipping_address: shippingAddress,
                shipping_city: shippingCity,
                shipping_region: shippingRegion || undefined,
                order_notes: orderNotes || undefined
            };

            await createOrder.mutateAsync(orderData);
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Failed to create order');
        }
    };

    const isInCart = (productId: number) => cart.some(item => item.product.id === productId);
    const getCartItem = (productId: number) => cart.find(item => item.product.id === productId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Create Order for {leadName}
                    </DialogTitle>
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {[1, 2, 3].map((s) => (
                            <React.Fragment key={s}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                                >
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-16 h-1 rounded ${step > s ? 'bg-blue-600' : 'bg-slate-700'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-center gap-8 text-sm text-slate-400">
                        <span className={step === 1 ? 'text-white font-medium' : ''}>Products</span>
                        <span className={step === 2 ? 'text-white font-medium' : ''}>Shipping</span>
                        <span className={step === 3 ? 'text-white font-medium' : ''}>Review</span>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {error && (
                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <span className="text-red-400">{error}</span>
                            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError('')}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step 1: Product Selection */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search products..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {(categories || []).map((cat: Category) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Products Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                                {productsLoading ? (
                                    <div className="col-span-full text-center py-8 text-slate-400">
                                        Loading products...
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-slate-400">
                                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        No products available
                                    </div>
                                ) : (
                                    products.map((product: Product) => {
                                        const inCart = isInCart(product.id);
                                        const cartItem = getCartItem(product.id);

                                        return (
                                            <div
                                                key={product.id}
                                                className={`p-3 rounded-lg border ${inCart
                                                        ? 'bg-blue-900/30 border-blue-600'
                                                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{product.name}</p>
                                                        <p className="text-xs text-slate-400">{product.sku}</p>
                                                    </div>
                                                    <Badge className={`text-xs ${product.stock_quantity > 10 ? 'bg-green-600' : 'bg-orange-600'}`}>
                                                        {product.stock_quantity} in stock
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-emerald-400 font-semibold">
                                                        {product.selling_price} MAD
                                                    </span>
                                                    {inCart ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => updateQuantity(product.id, (cartItem?.quantity || 1) - 1)}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="w-8 text-center font-medium">{cartItem?.quantity}</span>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => updateQuantity(product.id, (cartItem?.quantity || 0) + 1)}
                                                                disabled={cartItem?.quantity !== undefined && cartItem.quantity >= product.stock_quantity}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 h-7"
                                                            onClick={() => addToCart(product)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Add
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Cart Summary */}
                            {cart.length > 0 && (
                                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Cart ({totalItems} items)
                                    </h4>
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {cart.map(item => (
                                            <div key={item.product.id} className="flex items-center justify-between bg-slate-800 rounded p-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{item.product.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {item.product.selling_price} x {item.quantity} = {item.product.selling_price * item.quantity} MAD
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400 hover:text-red-300"
                                                    onClick={() => removeFromCart(item.product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-slate-600 mt-3 pt-3 flex justify-between">
                                        <span className="font-medium">Subtotal:</span>
                                        <span className="text-emerald-400 font-bold">{itemsSubtotal} MAD</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Shipping Details */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>Shipping Address *</Label>
                                    <Textarea
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        placeholder="Enter full address"
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div>
                                    <Label>City *</Label>
                                    <Input
                                        value={shippingCity}
                                        onChange={(e) => setShippingCity(e.target.value)}
                                        placeholder="e.g., Casablanca"
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div>
                                    <Label>Region</Label>
                                    <Input
                                        value={shippingRegion}
                                        onChange={(e) => setShippingRegion(e.target.value)}
                                        placeholder="e.g., Grand Casablanca"
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div>
                                    <Label>Shipping Cost (MAD)</Label>
                                    <Input
                                        type="number"
                                        value={shippingCost}
                                        onChange={(e) => setShippingCost(e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div>
                                    <Label>Order Discount (MAD)</Label>
                                    <Input
                                        type="number"
                                        value={orderDiscount}
                                        onChange={(e) => setOrderDiscount(e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Order Notes</Label>
                                    <Textarea
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        placeholder="Any special instructions..."
                                        className="bg-slate-700 border-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="bg-slate-700/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">Customer</h4>
                                <p className="text-white">{leadName}</p>
                                <p className="text-slate-400 text-sm">{leadPhone}</p>
                            </div>

                            {/* Shipping Info */}
                            <div className="bg-slate-700/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">Shipping To</h4>
                                <p className="text-white">{shippingAddress}</p>
                                <p className="text-slate-400 text-sm">{shippingCity}{shippingRegion ? `, ${shippingRegion}` : ''}</p>
                            </div>

                            {/* Order Items */}
                            <div className="bg-slate-700/50 rounded-lg p-4">
                                <h4 className="font-medium mb-3">Order Items</h4>
                                <div className="space-y-2">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex justify-between items-center">
                                            <div>
                                                <span className="text-white">{item.product.name}</span>
                                                <span className="text-slate-400 text-sm ml-2">x{item.quantity}</span>
                                            </div>
                                            <span className="text-white">{item.product.selling_price * item.quantity - item.discount} MAD</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-slate-700/50 rounded-lg p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal</span>
                                        <span>{itemsSubtotal} MAD</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Shipping</span>
                                        <span>{shipping} MAD</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Discount</span>
                                            <span>-{discount} MAD</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-600">
                                        <span>Total (COD)</span>
                                        <span className="text-emerald-400">{total} MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between w-full">
                        <Button
                            variant="outline"
                            onClick={() => step === 1 ? onOpenChange(false) : setStep(step - 1)}
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </Button>
                        <div className="flex gap-2">
                            {step < 3 ? (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setStep(step + 1)}
                                    disabled={step === 1 && cart.length === 0}
                                >
                                    Continue
                                </Button>
                            ) : (
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleSubmit}
                                    disabled={createOrder.isPending}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {createOrder.isPending ? 'Creating...' : 'Create Order'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
