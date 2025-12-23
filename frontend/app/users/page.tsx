'use client';

import React, { useState } from 'react';
import {
    Users, Search, Plus, MoreVertical, Edit, UserCheck,
    UserX, Shield, Phone, TrendingUp, Key,
    RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useActivateUser,
    useDeactivateUser,
    useResetPassword,
    useUserPerformance
} from '@/hooks/useUsers';
import { User, UserRole } from '@/lib/api';

const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
        admin: 'bg-red-600',
        manager: 'bg-purple-600',
        agent: 'bg-blue-600',
        fulfillment: 'bg-orange-600',
        viewer: 'bg-slate-600',
    };
    return <Badge className={`${colors[role] || 'bg-slate-600'} text-white`}>{role}</Badge>;
};

const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
        admin: 'Full system access',
        manager: 'Manage team & reports',
        agent: 'Handle leads & calls',
        fulfillment: 'Manage orders',
        viewer: 'View only',
    };
    return descriptions[role] || '';
};

export default function UsersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialogs
    const [createDialog, setCreateDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [performanceDialog, setPerformanceDialog] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
    const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });

    // Form states
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'agent' as UserRole,
    });
    const [editUser, setEditUser] = useState({
        full_name: '',
        phone: '',
        role: 'agent' as UserRole,
    });
    const [newPassword, setNewPassword] = useState('');

    // Queries & Mutations
    const { data: usersData, isLoading, refetch } = useUsers({
        page,
        page_size: 20,
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    });

    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const activateUser = useActivateUser();
    const deactivateUser = useDeactivateUser();
    const resetPassword = useResetPassword();
    const { data: performance } = useUserPerformance(performanceDialog.userId);

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.full_name) return;

        try {
            await createUser.mutateAsync(newUser);
            setCreateDialog(false);
            setNewUser({ email: '', password: '', full_name: '', phone: '', role: 'agent' });
        } catch (error: unknown) {
            const err = error as Error;
            alert(err.message);
        }
    };

    const handleUpdateUser = async () => {
        if (!editDialog.user) return;

        try {
            await updateUser.mutateAsync({
                userId: editDialog.user.id,
                data: editUser,
            });
            setEditDialog({ open: false, user: null });
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleToggleStatus = async (user: User) => {
        if (user.is_active) {
            await deactivateUser.mutateAsync(user.id);
        } else {
            await activateUser.mutateAsync(user.id);
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordDialog.user || !newPassword) return;

        try {
            await resetPassword.mutateAsync({
                userId: resetPasswordDialog.user.id,
                newPassword,
            });
            setResetPasswordDialog({ open: false, user: null });
            setNewPassword('');
            alert('Password reset successfully!');
        } catch (error) {
            console.error('Failed to reset password:', error);
        }
    };

    const openEditDialog = (user: User) => {
        setEditUser({
            full_name: user.full_name || '',
            phone: user.phone || '',
            role: user.role,
        });
        setEditDialog({ open: true, user });
    };

    const users = usersData?.users || [];
    const total = usersData?.total || 0;
    const totalPages = Math.ceil(total / 20);

    // Stats
    const activeUsers = users.filter((u: User) => u.is_active).length;
    const adminCount = users.filter((u: User) => u.role === 'admin').length;
    const agentCount = users.filter((u: User) => u.role === 'agent').length;

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="h-7 w-7" />
                        User Management
                    </h1>
                    <p className="text-slate-400">Manage team members and permissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setCreateDialog(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Total Users</p>
                                <p className="text-2xl font-bold text-white">{total}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Active</p>
                                <p className="text-2xl font-bold text-green-500">{activeUsers}</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Admins</p>
                                <p className="text-2xl font-bold text-red-500">{adminCount}</p>
                            </div>
                            <Shield className="h-8 w-8 text-red-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Agents</p>
                                <p className="text-2xl font-bold text-blue-500">{agentCount}</p>
                            </div>
                            <Phone className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-slate-800 border-slate-700 mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="fulfillment">Fulfillment</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                    <th className="p-4">User</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Leads</th>
                                    <th className="p-4">Conversion</th>
                                    <th className="p-4">Last Login</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user: User) => (
                                        <tr key={user.id} className="text-white border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.full_name || 'No name'}</p>
                                                        <p className="text-sm text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getRoleBadge(user.role)}
                                                <p className="text-xs text-slate-500 mt-1">{getRoleDescription(user.role)}</p>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={user.is_active ? 'bg-green-600' : 'bg-slate-600'}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-white font-medium">{user.leads_assigned}</span>
                                                <span className="text-slate-400 text-sm ml-1">assigned</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-medium ${user.conversion_rate >= 20 ? 'text-green-400' : user.conversion_rate >= 10 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                    {user.conversion_rate}%
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">
                                                {user.last_login ? format(new Date(user.last_login), 'MMM d, HH:mm') : 'Never'}
                                            </td>
                                            <td className="p-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-slate-700"
                                                            onClick={() => setPerformanceDialog({ open: true, userId: user.id })}
                                                        >
                                                            <TrendingUp className="h-4 w-4 mr-2" />
                                                            View Performance
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-slate-700"
                                                            onClick={() => openEditDialog(user)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-slate-700"
                                                            onClick={() => setResetPasswordDialog({ open: true, user })}
                                                        >
                                                            <Key className="h-4 w-4 mr-2" />
                                                            Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-700" />
                                                        <DropdownMenuItem
                                                            className={user.is_active ? 'text-red-400 hover:bg-slate-700' : 'text-green-400 hover:bg-slate-700'}
                                                            onClick={() => handleToggleStatus(user)}
                                                        >
                                                            {user.is_active ? (
                                                                <><UserX className="h-4 w-4 mr-2" /> Deactivate</>
                                                            ) : (
                                                                <><UserCheck className="h-4 w-4 mr-2" /> Activate</>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-700">
                            <p className="text-sm text-slate-400">
                                Page {page} of {totalPages} ({total} users)
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="border-slate-700"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="border-slate-700"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Full Name *</Label>
                            <Input
                                value={newUser.full_name}
                                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                placeholder="John Doe"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="john@example.com"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Password *</Label>
                            <Input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="••••••••"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                placeholder="+212600000000"
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Role</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                            >
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="agent">Agent</SelectItem>
                                    <SelectItem value="fulfillment">Fulfillment</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleCreateUser}
                            disabled={!newUser.email || !newUser.password || !newUser.full_name || createUser.isPending}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit User: {editDialog.user?.full_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input
                                value={editUser.full_name}
                                onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                value={editUser.phone}
                                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Role</Label>
                            <Select
                                value={editUser.role}
                                onValueChange={(value: UserRole) => setEditUser({ ...editUser, role: value })}
                            >
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="agent">Agent</SelectItem>
                                    <SelectItem value="fulfillment">Fulfillment</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleUpdateUser}
                            disabled={updateUser.isPending}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ open, user: null })}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Reset Password: {resetPasswordDialog.user?.full_name}</DialogTitle>
                    </DialogHeader>
                    <div>
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            className="bg-slate-700 border-slate-600"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetPasswordDialog({ open: false, user: null })}>Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleResetPassword}
                            disabled={!newPassword || newPassword.length < 6 || resetPassword.isPending}
                        >
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Performance Dialog */}
            <Dialog open={performanceDialog.open} onOpenChange={(open) => setPerformanceDialog({ open, userId: null })}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Performance: {performance?.user_name}
                        </DialogTitle>
                    </DialogHeader>
                    {performance && (
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="bg-slate-700/50 border-slate-600">
                                <CardContent className="p-4">
                                    <p className="text-xs text-slate-400">Leads</p>
                                    <p className="text-2xl font-bold text-blue-400">{performance.leads.total}</p>
                                    <p className="text-sm text-green-400">{performance.leads.conversion_rate}% converted</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-700/50 border-slate-600">
                                <CardContent className="p-4">
                                    <p className="text-xs text-slate-400">Calls</p>
                                    <p className="text-2xl font-bold text-purple-400">{performance.calls.total}</p>
                                    <p className="text-sm text-green-400">{performance.calls.contact_rate}% contact rate</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-700/50 border-slate-600">
                                <CardContent className="p-4">
                                    <p className="text-xs text-slate-400">Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-400">{performance.orders.revenue} MAD</p>
                                    <p className="text-sm text-slate-400">{performance.orders.delivered} orders delivered</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
