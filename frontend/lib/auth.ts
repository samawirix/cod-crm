'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    phone?: string;
    avatar_url?: string;
}

export function useAuth(options: { requireAuth?: boolean } = { requireAuth: true }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            setLoading(false);
            setIsAuthenticated(false);
            if (options.requireAuth) {
                router.push('/login');
            }
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(userData));
                return userData;
            } else {
                // Token invalid
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                if (options.requireAuth) {
                    router.push('/login');
                }
                return null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Network error - check cached user
            const cachedUser = localStorage.getItem('user');
            if (cachedUser) {
                try {
                    const userData = JSON.parse(cachedUser);
                    setUser(userData);
                    setIsAuthenticated(true);
                    return userData;
                } catch {
                    // Invalid cached data
                }
            }
        } finally {
            setLoading(false);
        }
        return null;
    }, [router, options.requireAuth]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    }, [router]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);

        // Fetch user info
        const userData = await checkAuth();
        return userData;
    }, [checkAuth]);

    return {
        user,
        loading,
        isAuthenticated,
        logout,
        login,
        checkAuth,
        token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    };
}

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

export function getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch {
            return null;
        }
    }
    return null;
}

export function isLoggedIn(): boolean {
    return !!getToken();
}
