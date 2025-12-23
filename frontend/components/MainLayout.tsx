'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const publicRoutes = ['/login', '/register', '/forgot-password'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('access_token');
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
        if (!token && !isPublicRoute) {
            router.push('/login');
        }
    }, [pathname, router]);

    if (!mounted) return null;

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    if (isPublicRoute) return <>{children}</>;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-sidebar min-h-screen p-6 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
