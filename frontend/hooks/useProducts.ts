import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.getCategories(),
    });
}

export function useProducts(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category_id?: number;
    is_active?: boolean;
    is_featured?: boolean;
    low_stock_only?: boolean;
    out_of_stock_only?: boolean;
    sort_by?: string;
    sort_order?: string;
}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: () => api.getProducts(params),
    });
}

export function useProduct(productId: number | null) {
    return useQuery({
        queryKey: ['product', productId],
        queryFn: () => api.getProduct(productId!),
        enabled: !!productId,
    });
}

export function useInventoryStats() {
    return useQuery({
        queryKey: ['inventory-stats'],
        queryFn: () => api.getInventoryStats(),
    });
}

export function useLowStockProducts(limit: number = 10) {
    return useQuery({
        queryKey: ['low-stock-products', limit],
        queryFn: () => api.getLowStockProducts(limit),
    });
}

export function useTopSellingProducts(limit: number = 10) {
    return useQuery({
        queryKey: ['top-selling-products', limit],
        queryFn: () => api.getTopSellingProducts(limit),
    });
}

export function useStockMovements(productId: number | null) {
    return useQuery({
        queryKey: ['stock-movements', productId],
        queryFn: () => api.getStockMovements(productId!),
        enabled: !!productId,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, data }: { productId: number; data: Partial<api.CreateProductData> }) =>
            api.updateProduct(productId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
        },
    });
}

export function useAdjustStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, data }: { productId: number; data: { quantity: number; reason: string; notes?: string } }) =>
            api.adjustStock(productId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}
