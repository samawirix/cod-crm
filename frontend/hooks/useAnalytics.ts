import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function useDashboardStats(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['dashboard-stats', startDate, endDate],
        queryFn: () => api.getDashboardStats(startDate, endDate),
    });
}

export function useLeadsByDay(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['leads-by-day', startDate, endDate],
        queryFn: () => api.getLeadsByDay(startDate, endDate),
    });
}

export function useLeadsBySource(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['leads-by-source', startDate, endDate],
        queryFn: () => api.getLeadsBySource(startDate, endDate),
    });
}

export function useAgentPerformance(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['agent-performance', startDate, endDate],
        queryFn: () => api.getAgentPerformance(startDate, endDate),
    });
}

export function useConversionFunnel(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['conversion-funnel', startDate, endDate],
        queryFn: () => api.getConversionFunnel(startDate, endDate),
    });
}

export function useCallStatistics(startDate?: string, endDate?: string, userId?: number) {
    return useQuery({
        queryKey: ['call-statistics', startDate, endDate, userId],
        queryFn: () => api.getCallStatistics(startDate, endDate, userId),
    });
}
