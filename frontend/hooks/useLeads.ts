import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { apiClient } from '@/lib/api';

export function useLeads(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    source?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: ['leads', params],
        queryFn: () => api.getLeads(params),
    });
}

export function useLead(leadId: number | null) {
    return useQuery({
        queryKey: ['lead', leadId],
        queryFn: () => api.getLead(leadId!),
        enabled: !!leadId,
    });
}

export function useCreateLead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}

export function useUpdateLead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ leadId, data }: { leadId: number; data: any }) =>
            api.updateLead(leadId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead'] });
        },
    });
}

export function useDeleteLead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}

// ============== BULK OPERATIONS ==============

export function useBulkUpdateLeads() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ids, status, assignedTo }: {
            ids: number[];
            status?: string;
            assignedTo?: number;
        }) => {
            const response = await apiClient.post('/api/v1/leads/bulk-update', {
                ids,
                status,
                assigned_to: assignedTo,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}

export function useBulkDeleteLeads() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            const response = await apiClient.post('/api/v1/leads/bulk-delete', { ids });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}
