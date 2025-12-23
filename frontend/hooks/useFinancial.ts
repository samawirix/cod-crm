import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function useFinancialSummary(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['financial-summary', startDate, endDate],
        queryFn: () => api.getFinancialSummary(startDate, endDate),
    });
}

export function useRevenueByDay(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['revenue-by-day', startDate, endDate],
        queryFn: () => api.getRevenueByDay(startDate, endDate),
    });
}

export function useRevenueByProduct(startDate?: string, endDate?: string, limit: number = 10) {
    return useQuery({
        queryKey: ['revenue-by-product', startDate, endDate, limit],
        queryFn: () => api.getRevenueByProduct(startDate, endDate, limit),
    });
}

export function useRevenueByCity(startDate?: string, endDate?: string, limit: number = 10) {
    return useQuery({
        queryKey: ['revenue-by-city', startDate, endDate, limit],
        queryFn: () => api.getRevenueByCity(startDate, endDate, limit),
    });
}

export function useMonthlyComparison(months: number = 6) {
    return useQuery({
        queryKey: ['monthly-comparison', months],
        queryFn: () => api.getMonthlyComparison(months),
    });
}

export function useProfitAnalysis(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['profit-analysis', startDate, endDate],
        queryFn: () => api.getProfitAnalysis(startDate, endDate),
    });
}
