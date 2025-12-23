'use client';

import React, { useState } from 'react';
import {
    Users, Search, Plus, MoreVertical, Phone, Mail, MapPin,
    Edit, Trash2, Eye, RefreshCw,
    ChevronLeft, ChevronRight, UserPlus, CheckCircle,
    TrendingUp, ShoppingCart, MessageSquare, Clock
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
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useBulkUpdateLeads, useBulkDeleteLeads } from '@/hooks/useLeads';
import { useUsers } from '@/hooks/useUsers';
import { useProducts } from '@/hooks/useProducts';
import { Lead } from '@/lib/api';
import Checkbox from '@/components/ui/checkbox';

// Helper to get lead display name
const getLeadName = (lead: Lead): string => {
    if (lead.full_name) return lead.full_name;
    if (lead.first_name) {
        return lead.last_name ? `${lead.first_name} ${lead.last_name}` : lead.first_name;
    }
    return 'Unknown';
};

// Helper to get lead initials
const getLeadInitials = (lead: Lead): string => {
    const name = getLeadName(lead);
    if (name === 'Unknown') return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        NEW: 'bg-blue-600',
        CONTACTED: 'bg-cyan-600',
        QUALIFIED: 'bg-purple-600',
        CONFIRMED: 'bg-green-600',
        WON: 'bg-emerald-600',
        LOST: 'bg-red-600',
        RETURNED: 'bg-orange-600',
    };
    return <Badge className={`${styles[status] || 'bg-slate-600'} text-white`}>{status}</Badge>;
};

export default function LeadsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Dialogs
    const [createDialog, setCreateDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
    const [viewDialog, setViewDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
    const [orderDialog, setOrderDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });

    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        source: 'WEBSITE',
        notes: '',
        status: 'NEW',
        product_interest: '',
        quantity: 1,
        unit_price: 0,
    });

    // Fetch leads - using available params
    const { data: leadsData, isLoading, refetch } = useLeads({
        page,
        page_size: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
    });

    const createLead = useCreateLead();
    const updateLead = useUpdateLead();
    const deleteLead = useDeleteLead();
    const bulkUpdate = useBulkUpdateLeads();
    const bulkDelete = useBulkDeleteLeads();

    // Get users for bulk assign dropdown
    const { data: usersData } = useUsers();
    // Get products for dropdown
    const { data: productsData } = useProducts({ page: 1, page_size: 100 });
    const products = productsData?.products || [];
    // Use data safely or fallback
    const agents = usersData?.users || [];

    const leads = leadsData?.leads || [];
    const total = leadsData?.total || 0;
    const totalPages = Math.ceil(total / 20);

    // Stats
    const newLeads = leads.filter((l: Lead) => l.status === 'NEW').length;
    const qualifiedLeads = leads.filter((l: Lead) => l.status === 'QUALIFIED').length;
    const confirmedLeads = leads.filter((l: Lead) => l.status === 'CONFIRMED').length;

    // Selection helpers
    const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;
    const isPartialSelected = selectedIds.length > 0 && selectedIds.length < leads.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(leads.map((l: Lead) => l.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateLead = async () => {
        if (!formData.first_name || !formData.phone) return;

        try {
            await createLead.mutateAsync(formData);
            setCreateDialog(false);
            resetForm();
        } catch (error) {
            console.error('Failed to create lead:', error);
        }
    };

    const handleUpdateLead = async () => {
        if (!editDialog.lead) return;

        try {
            await updateLead.mutateAsync({
                leadId: editDialog.lead.id,
                data: formData,
            });
            setEditDialog({ open: false, lead: null });
            resetForm();
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    };

    const handleDeleteLead = async () => {
        if (!deleteDialog.lead) return;

        try {
            await deleteLead.mutateAsync(deleteDialog.lead.id);
            setDeleteDialog({ open: false, lead: null });
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    };

    const openEditDialog = (lead: Lead) => {
        setFormData({
            first_name: lead.first_name || '',
            last_name: lead.last_name || '',
            phone: lead.phone || '',
            email: lead.email || '',
            city: lead.city || '',
            address: lead.address || '',
            source: lead.source || 'WEBSITE',
            notes: '',
            status: lead.status || 'NEW',
            product_interest: lead.product_interest || '',
            quantity: lead.quantity || 1,
            unit_price: lead.unit_price || 0,
        });
        setEditDialog({ open: true, lead });
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            phone: '',
            email: '',
            city: '',
            address: '',
            source: 'WEBSITE',
            notes: '',
            status: 'NEW',
            product_interest: '',
            quantity: 1,
            unit_price: 0,
        });
    };

    // Format phone for WhatsApp
    const formatPhoneForWhatsApp = (phone: string) => {
        return phone?.replace(/[^0-9]/g, '') || '';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="h-7 w-7" />
                        Leads Management
                    </h1>
                    <p className="text-slate-400">Manage and track your leads</p>
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
                        onClick={() => {
                            resetForm();
                            setCreateDialog(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lead
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Total Leads</p>
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
                                <p className="text-xs text-slate-400">New</p>
                                <p className="text-2xl font-bold text-cyan-500">{newLeads}</p>
                            </div>
                            <UserPlus className="h-8 w-8 text-cyan-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Qualified</p>
                                <p className="text-2xl font-bold text-purple-500">{qualifiedLeads}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-purple-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Confirmed</p>
                                <p className="text-2xl font-bold text-green-500">{confirmedLeads}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
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
                                    placeholder="Search by name, phone, city..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="WON">Won</SelectItem>
                                <SelectItem value="LOST">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                    <th className="p-4 w-12">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                            indeterminate={isPartialSelected}
                                        />
                                    </th>
                                    <th className="p-4">Lead</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">City</th>
                                    <th className="p-4">Product Interest</th>
                                    <th className="p-4">Source</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Created</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400">
                                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            No leads found
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead: Lead) => (
                                        <tr key={lead.id} className={`text-white border-b border-slate-700/50 hover:bg-slate-700/30 ${selectedIds.includes(lead.id) ? 'bg-blue-900/20' : ''}`}>
                                            <td className="p-4 w-12">
                                                <Checkbox
                                                    checked={selectedIds.includes(lead.id)}
                                                    onChange={() => toggleSelect(lead.id)}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {getLeadInitials(lead)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{getLeadName(lead)}</p>
                                                        <p className="text-sm text-slate-400">ID: {lead.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-white hover:text-green-400 transition-colors">
                                                            <Phone className="h-4 w-4 text-green-500" />
                                                            {lead.phone}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white transition-colors">
                                                            <WhatsAppIcon className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                    {lead.city || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {lead.product_interest ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-purple-600 text-white text-xs">
                                                            {lead.product_interest.length > 20 ? lead.product_interest.substring(0, 20) + '...' : lead.product_interest}
                                                        </Badge>
                                                        {lead.quantity > 1 && <span className="text-slate-400 text-xs">x{lead.quantity}</span>}
                                                    </div>
                                                ) : <span className="text-slate-500 text-sm">-</span>}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="border-slate-600">{lead.source || 'Unknown'}</Badge>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(lead.status)}
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">
                                                {lead.created_at ? format(new Date(lead.created_at), 'MMM d, yyyy') : '-'}
                                            </td>
                                            <td className="p-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                                        <DropdownMenuItem className="text-white hover:bg-slate-700" onClick={() => setViewDialog({ open: true, lead })}>
                                                            <Eye className="h-4 w-4 mr-2" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-white hover:bg-slate-700" onClick={() => openEditDialog(lead)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit Lead
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-700" />
                                                        <DropdownMenuItem className="text-red-400 hover:bg-slate-700" onClick={() => setDeleteDialog({ open: true, lead })}>
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
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

                    {/* Pagination - Simplified */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-700">
                            <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
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

            {/* Create/Edit Lead Dialog */}
            <Dialog open={createDialog || editDialog.open} onOpenChange={(open) => {
                if (!open) {
                    setCreateDialog(false);
                    setEditDialog({ open: false, lead: null });
                }
            }}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editDialog.lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {/* First Name */}
                        <div>
                            <Label className="text-slate-300">First Name <span className="text-red-400">*</span></Label>
                            <Input
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                                placeholder="Ahmed"
                            />
                        </div>
                        {/* Last Name */}
                        <div>
                            <Label className="text-slate-300">Last Name</Label>
                            <Input
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                                placeholder="Benali"
                            />
                        </div>
                        {/* Phone */}
                        <div>
                            <Label className="text-slate-300">Phone <span className="text-red-400">*</span></Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                                placeholder="+212612345678"
                            />
                        </div>
                        {/* Email */}
                        <div>
                            <Label className="text-slate-300">Email</Label>
                            <Input
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                                placeholder="email@example.com"
                            />
                        </div>
                        {/* City */}
                        <div>
                            <Label className="text-slate-300">City</Label>
                            <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue placeholder="Select city..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="Casablanca">Casablanca</SelectItem>
                                    <SelectItem value="Rabat">Rabat</SelectItem>
                                    <SelectItem value="Marrakech">Marrakech</SelectItem>
                                    <SelectItem value="Fès">Fès</SelectItem>
                                    <SelectItem value="Tanger">Tanger</SelectItem>
                                    <SelectItem value="Agadir">Agadir</SelectItem>
                                    <SelectItem value="Meknès">Meknès</SelectItem>
                                    <SelectItem value="Oujda">Oujda</SelectItem>
                                    <SelectItem value="Kenitra">Kenitra</SelectItem>
                                    <SelectItem value="Tétouan">Tétouan</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Source */}
                        <div>
                            <Label className="text-slate-300">Lead Source</Label>
                            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue placeholder="Select source..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                    <SelectItem value="TIKTOK">TikTok</SelectItem>
                                    <SelectItem value="GOOGLE">Google</SelectItem>
                                    <SelectItem value="WEBSITE">Website</SelectItem>
                                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                    <SelectItem value="REFERRAL">Referral</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Product Interest */}
                        <div className="col-span-2">
                            <Label className="text-slate-300">Product Interest</Label>
                            <Select value={formData.product_interest} onValueChange={(value) => setFormData({ ...formData, product_interest: value })}>
                                <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue placeholder="Select a product..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                                    {products.map((product: any) => (
                                        <SelectItem key={product.id} value={product.name}>
                                            {product.name} - {product.price?.toFixed(0) || 0} MAD
                                        </SelectItem>
                                    ))}
                                    {products.length === 0 && (
                                        <SelectItem value="" disabled>No products available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Address */}
                        <div className="col-span-2">
                            <Label className="text-slate-300">Address</Label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                                placeholder="123 Rue Example, Quartier..."
                            />
                        </div>
                        {/* Notes */}
                        <div className="col-span-2">
                            <Label className="text-slate-300">Notes</Label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white resize-none"
                                rows={3}
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCreateDialog(false); setEditDialog({ open: false, lead: null }); resetForm(); }}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={editDialog.lead ? handleUpdateLead : handleCreateLead} disabled={createLead.isPending || updateLead.isPending}>
                            {createLead.isPending || updateLead.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, lead: open ? viewDialog.lead : null })}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Lead Details</DialogTitle>
                    </DialogHeader>
                    {viewDialog.lead && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400">Full Name</p>
                                    <p className="text-lg font-medium">{getLeadName(viewDialog.lead)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Status</p>
                                    {getStatusBadge(viewDialog.lead.status)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400">Phone</p>
                                    <p className="text-blue-400 font-medium">{viewDialog.lead.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Email</p>
                                    <p className="text-slate-300">{viewDialog.lead.email || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400">City</p>
                                    <p className="text-slate-300">{viewDialog.lead.city || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Source</p>
                                    <p className="text-purple-400">{viewDialog.lead.source || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Product Interest</p>
                                <p className="text-green-400">{viewDialog.lead.product_interest || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Address</p>
                                <p className="text-slate-300">{viewDialog.lead.address || '-'}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400">Lead Score</p>
                                    <p className="text-lg font-bold text-yellow-400">{viewDialog.lead.lead_score || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Delivered</p>
                                    <p className="text-lg font-bold text-green-400">{viewDialog.lead.delivered_orders || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Returned</p>
                                    <p className="text-lg font-bold text-red-400">{viewDialog.lead.returned_orders || 0}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Created</p>
                                <p className="text-sm text-slate-500">
                                    {viewDialog.lead.created_at ? format(new Date(viewDialog.lead.created_at), 'PPpp') : '-'}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialog({ open: false, lead: null })}>Close</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                            if (viewDialog.lead) {
                                openEditDialog(viewDialog.lead);
                                setViewDialog({ open: false, lead: null });
                            }
                        }}>Edit Lead</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, lead: open ? deleteDialog.lead : null })}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete Lead</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-300">
                            Are you sure you want to delete <span className="font-bold text-white">{deleteDialog.lead ? getLeadName(deleteDialog.lead) : ''}</span>?
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                            This action cannot be undone. All data associated with this lead will be permanently removed.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, lead: null })}>Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteLead}
                            disabled={deleteLead.isPending}
                        >
                            {deleteLead.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
