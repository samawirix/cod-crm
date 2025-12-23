import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function useOrders(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    payment_status?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => api.getOrders(params),
    });
}

export function useOrder(orderId: number | null) {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => api.getOrder(orderId!),
        enabled: !!orderId,
    });
}

export function useOrderStats() {
    return useQuery({
        queryKey: ['order-stats'],
        queryFn: () => api.getOrderStats(),
    });
}

export function useOrderHistory(orderId: number | null) {
    return useQuery({
        queryKey: ['order-history', orderId],
        queryFn: () => api.getOrderHistory(orderId!),
        enabled: !!orderId,
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

export function useConfirmOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: { confirmed_by: string; notes?: string } }) =>
            api.confirmOrder(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

export function useShipOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: { tracking_number: string; delivery_partner: string } }) =>
            api.shipOrder(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

export function useDeliverOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: { success: boolean; cash_collected?: number } }) =>
            api.deliverOrder(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

export function useReturnOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: { return_reason: string; notes?: string } }) =>
            api.returnOrder(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
            api.cancelOrder(orderId, reason, 'System'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

// ============ NEW MULTI-PRODUCT ORDER HOOKS ============

export function useAvailableProducts(search?: string, category_id?: number) {
    return useQuery({
        queryKey: ['available-products', search, category_id],
        queryFn: () => api.getAvailableProducts(search, category_id),
    });
}

export function useCreateOrderWithItems() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createOrderWithItems,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
        },
    });
}

export function useOrderItems(orderId: number | null) {
    return useQuery({
        queryKey: ['order-items', orderId],
        queryFn: () => api.getOrderItems(orderId!),
        enabled: !!orderId,
    });
}

// ============== BULK OPERATIONS ==============

import { apiClient } from '@/lib/api';

export function useBulkUpdateOrders() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
            const response = await apiClient.post('/api/v1/orders/bulk-update', {
                ids,
                status,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}

export function useBulkDeleteOrders() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            const response = await apiClient.post('/api/v1/orders/bulk-delete', { ids });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        },
    });
}
