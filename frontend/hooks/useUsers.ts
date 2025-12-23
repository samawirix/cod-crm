import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function useUsers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
}) {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => api.getUsers(params),
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ['current-user'],
        queryFn: () => api.getCurrentUser(),
    });
}

export function useAgents() {
    return useQuery({
        queryKey: ['agents'],
        queryFn: () => api.getAgents(),
    });
}

export function useUser(userId: number | null) {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => api.getUserById(userId!),
        enabled: !!userId,
    });
}

export function useUserPerformance(userId: number | null) {
    return useQuery({
        queryKey: ['user-performance', userId],
        queryFn: () => api.getUserPerformance(userId!),
        enabled: !!userId,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['agents'] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, data }: { userId: number; data: api.UpdateUserData }) =>
            api.updateUser(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

export function useActivateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.activateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useDeactivateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deactivateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) =>
            api.resetUserPassword(userId, newPassword),
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
            api.changePassword(currentPassword, newPassword),
    });
}
