'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, Phone, ShoppingCart, Package, Truck, Trophy,
    BarChart3, DollarSign, TrendingDown, Settings, LogOut, UserCircle
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users, badge: 'New' },
    { name: 'Call Center', href: '/calls', icon: Phone },
    { name: 'Agent Performance', href: '/agents', icon: Trophy },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Shipping', href: '/shipping', icon: Truck },
    { name: 'Inventory', href: '/products', icon: Package },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Financial', href: '/financial', icon: DollarSign },
    { name: 'Marketing Spend', href: '/financial/marketing-spend', icon: TrendingDown },
    { name: 'Users', href: '/users', icon: UserCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-sidebar bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border flex flex-col z-50">
            {/* Logo */}
            <div className="h-16 px-4 flex items-center border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                    C
                </div>
                <span className="text-base font-semibold text-foreground">COD CRM</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{item.name}</span>
                            {item.badge && (
                                <span className="ml-auto px-2 py-0.5 text-[11px] font-medium bg-primary text-white rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="p-3 border-t border-border">
                <div className="flex items-center gap-3 p-2.5 rounded-md bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-success-fg flex items-center justify-center text-white text-xs font-bold">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">Admin User</div>
                        <div className="text-xs text-muted-foreground truncate">admin@cod-crm.com</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
