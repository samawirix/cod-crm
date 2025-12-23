'use client';

import React, { useState } from 'react';
import {
    Settings, User, Bell, Shield, Truck, Save, Check, Building, Key, RefreshCw, Eye, EyeOff, Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useCurrentUser, useChangePassword } from '@/hooks/useUsers';

export default function SettingsPage() {
    const { data: currentUser } = useCurrentUser();
    const changePassword = useChangePassword();

    // Tab state
    const [activeTab, setActiveTab] = useState('profile');

    // Profile form
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
    });

    // Business settings
    const [business, setBusiness] = useState({
        company_name: 'COD Express',
        address: '123 Business Street, Casablanca',
        phone: '+212 600 000 000',
        email: 'contact@codexpress.ma',
        currency: 'MAD',
        timezone: 'Africa/Casablanca',
    });

    // Shipping settings
    const [shipping, setShipping] = useState({
        default_cost: '30',
        free_shipping_threshold: '500',
        shipping_companies: 'Amana Express, CTM, Chrono Diali, Aramex',
    });

    // Notification settings
    const [notifications, setNotifications] = useState({
        email_new_lead: true,
        email_new_order: true,
        email_order_delivered: true,
        email_low_stock: true,
        push_enabled: true,
    });

    // Password change
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [showPasswords, setShowPasswords] = useState(false);

    // Save states
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            alert('Passwords do not match!');
            return;
        }
        if (passwords.new.length < 6) {
            alert('Password must be at least 6 characters!');
            return;
        }

        try {
            await changePassword.mutateAsync({
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            setPasswordDialog(false);
            setPasswords({ current: '', new: '', confirm: '' });
            alert('Password changed successfully!');
        } catch (error: unknown) {
            const err = error as Error;
            alert(err.message || 'Failed to change password');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'business', label: 'Business', icon: Building },
        { id: 'costs', label: 'Costs', icon: Calculator },
        { id: 'shipping', label: 'Shipping', icon: Truck },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-600'
                }`}
        >
            <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="h-7 w-7" />
                        Settings
                    </h1>
                    <p className="text-slate-400">Manage your account and system preferences</p>
                </div>
                <Button
                    className={`${saved ? 'bg-green-600' : 'bg-blue-600'} hover:bg-blue-700`}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : saved ? (
                        <Check className="h-4 w-4 mr-2" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </Button>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-64 shrink-0">
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile Settings
                                </CardTitle>
                                <CardDescription>Update your personal information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {currentUser?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{currentUser?.full_name || 'User'}</p>
                                        <Badge className={`${currentUser?.role === 'admin' ? 'bg-red-600' :
                                            currentUser?.role === 'manager' ? 'bg-purple-600' : 'bg-blue-600'
                                            }`}>{currentUser?.role || 'agent'}</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Full Name</Label>
                                        <Input
                                            value={profile.full_name || currentUser?.full_name || ''}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            value={profile.email || currentUser?.email || ''}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={profile.phone || currentUser?.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="+212 600 000 000"
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Role</Label>
                                        <Input
                                            value={currentUser?.role || 'agent'}
                                            className="bg-slate-700 border-slate-600 text-white"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700">
                                    <Button
                                        variant="outline"
                                        className="border-slate-600"
                                        onClick={() => setPasswordDialog(true)}
                                    >
                                        <Key className="h-4 w-4 mr-2" />
                                        Change Password
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Business Tab */}
                    {activeTab === 'business' && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Building className="h-5 w-5" />
                                    Business Settings
                                </CardTitle>
                                <CardDescription>Configure your business information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label>Company Name</Label>
                                        <Input
                                            value={business.company_name}
                                            onChange={(e) => setBusiness({ ...business, company_name: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Address</Label>
                                        <Input
                                            value={business.address}
                                            onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={business.phone}
                                            onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            value={business.email}
                                            onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Currency</Label>
                                        <Select value={business.currency} onValueChange={(v) => setBusiness({ ...business, currency: v })}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                <SelectItem value="MAD">MAD - Moroccan Dirham</SelectItem>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Timezone</Label>
                                        <Select value={business.timezone} onValueChange={(v) => setBusiness({ ...business, timezone: v })}>
                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                <SelectItem value="Africa/Casablanca">Africa/Casablanca (GMT+1)</SelectItem>
                                                <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Costs Tab */}
                    {activeTab === 'costs' && (
                        <div className="space-y-6">
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-orange-500" />
                                        Operational Cost Configuration
                                    </CardTitle>
                                    <CardDescription>These costs are automatically deducted from order profits based on status.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Shipping & Logistics */}
                                    <div className="p-4 bg-slate-700/50 rounded-lg">
                                        <h4 className="text-white font-medium mb-4">Shipping & Logistics</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-slate-400">Default Shipping Cost (MAD)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={35}
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Cost paid to courier per order</p>
                                            </div>
                                            <div>
                                                <Label className="text-slate-400">Packaging Cost (MAD)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={3}
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Box, tape, materials per order</p>
                                            </div>
                                            <div>
                                                <Label className="text-slate-400">Return Shipping Cost (MAD)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={35}
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Cost when order is returned</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent Commissions */}
                                    <div className="p-4 bg-slate-700/50 rounded-lg">
                                        <h4 className="text-white font-medium mb-4">Agent Commissions</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-slate-400">Confirmation Fee (MAD)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={5}
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Paid per confirmed order</p>
                                            </div>
                                            <div>
                                                <Label className="text-slate-400">Delivery Bonus (MAD)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={10}
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Bonus per delivered order</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Other Fees */}
                                    <div className="p-4 bg-slate-700/50 rounded-lg">
                                        <h4 className="text-white font-medium mb-4">Other Fees</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-slate-400">COD Collection Fee (%)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={0}
                                                    step="0.1"
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">% of COD amount charged by courier</p>
                                            </div>
                                            <div>
                                                <Label className="text-slate-400">Other Fixed Fees (MAD)</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={0}
                                                    className="bg-slate-700 border-slate-600 text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Miscellaneous per-order fees</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profit Formula Preview */}
                                    <div className="p-4 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700 rounded-lg">
                                        <h4 className="text-emerald-400 font-medium mb-3">📊 Profit Calculation Formula</h4>
                                        <div className="text-sm text-slate-300 space-y-2">
                                            <p><strong className="text-green-400">DELIVERED:</strong> Revenue - COGS - Shipping(35) - Packaging(3) - Agent Confirm(5) - Agent Delivery(10) = Net Profit</p>
                                            <p><strong className="text-red-400">RETURNED:</strong> 0 - COGS - Shipping(35) - Return Shipping(35) - Packaging(3) - Agent Confirm(5) = <span className="text-red-400">LOSS</span></p>
                                            <p className="text-yellow-400 mt-4">⚠️ Returns cost you money! Track your return rate carefully.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Shipping Tab */}
                    {activeTab === 'shipping' && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Shipping Settings
                                </CardTitle>
                                <CardDescription>Configure shipping options and costs</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Default Shipping Cost (MAD)</Label>
                                        <Input
                                            type="number"
                                            value={shipping.default_cost}
                                            onChange={(e) => setShipping({ ...shipping, default_cost: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Free Shipping Threshold (MAD)</Label>
                                        <Input
                                            type="number"
                                            value={shipping.free_shipping_threshold}
                                            onChange={(e) => setShipping({ ...shipping, free_shipping_threshold: e.target.value })}
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Orders above this amount get free shipping</p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Shipping Companies</Label>
                                        <Input
                                            value={shipping.shipping_companies}
                                            onChange={(e) => setShipping({ ...shipping, shipping_companies: e.target.value })}
                                            placeholder="Comma-separated list"
                                            className="bg-slate-700 border-slate-600 text-white"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Comma-separated list of shipping companies</p>
                                    </div>
                                </div>

                                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                                    <h4 className="text-white font-medium mb-3">Shipping Regions</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir'].map((city) => (
                                            <div key={city} className="flex items-center justify-between bg-slate-800 rounded p-2">
                                                <span className="text-white text-sm">{city}</span>
                                                <Badge className="bg-green-600">Active</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Settings
                                </CardTitle>
                                <CardDescription>Configure how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-white font-medium">Email Notifications</h4>
                                    {[
                                        { key: 'email_new_lead', label: 'New Lead Received', desc: 'Get notified when a new lead is added' },
                                        { key: 'email_new_order', label: 'New Order Created', desc: 'Get notified when an order is placed' },
                                        { key: 'email_order_delivered', label: 'Order Delivered', desc: 'Get notified when orders are delivered' },
                                        { key: 'email_low_stock', label: 'Low Stock Alert', desc: 'Get notified when products are low on stock' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                            <div>
                                                <p className="text-white font-medium">{item.label}</p>
                                                <p className="text-slate-400 text-sm">{item.desc}</p>
                                            </div>
                                            <Toggle
                                                enabled={notifications[item.key as keyof typeof notifications] as boolean}
                                                onChange={() => setNotifications({
                                                    ...notifications,
                                                    [item.key]: !notifications[item.key as keyof typeof notifications]
                                                })}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-700">
                                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">Push Notifications</p>
                                            <p className="text-slate-400 text-sm">Enable browser push notifications</p>
                                        </div>
                                        <Toggle
                                            enabled={notifications.push_enabled}
                                            onChange={() => setNotifications({ ...notifications, push_enabled: !notifications.push_enabled })}
                                        />
                                    </div>
                                </div>

                                {/* Test Sound Section */}
                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-white font-medium mb-4">🔔 Notification Sound</h4>
                                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">Test Sound</p>
                                            <p className="text-slate-400 text-sm">
                                                Plays the notification sound used for new lead alerts
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const audio = new Audio('/sounds/notification.mp3');
                                                audio.volume = 0.5;
                                                audio.play().catch((e) => {
                                                    alert('Could not play sound. Make sure /public/sounds/notification.mp3 exists.');
                                                    console.error('Sound error:', e);
                                                });
                                            }}
                                            className="border-slate-600 text-white hover:bg-slate-600"
                                        >
                                            🔊 Play Test Sound
                                        </Button>
                                    </div>
                                    <p className="text-slate-500 text-xs mt-2">
                                        Sound file location: <code className="bg-slate-700 px-1 rounded">/public/sounds/notification.mp3</code>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Security Settings
                                </CardTitle>
                                <CardDescription>Manage your account security</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Password</p>
                                            <p className="text-slate-400 text-sm">Last changed: Never</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="border-slate-600"
                                            onClick={() => setPasswordDialog(true)}
                                        >
                                            <Key className="h-4 w-4 mr-2" />
                                            Change
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Two-Factor Authentication</p>
                                            <p className="text-slate-400 text-sm">Add an extra layer of security</p>
                                        </div>
                                        <Badge className="bg-slate-600">Not Enabled</Badge>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Active Sessions</p>
                                            <p className="text-slate-400 text-sm">Manage your active login sessions</p>
                                        </div>
                                        <Badge className="bg-green-600">1 Active</Badge>
                                    </div>
                                </div>

                                <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                                    <p className="text-red-400 font-medium">Danger Zone</p>
                                    <p className="text-red-300 text-sm mb-4">Irreversible actions</p>
                                    <Button variant="destructive" size="sm">
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Change Password Dialog */}
            <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    className="bg-slate-700 border-slate-600 pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                >
                                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label>New Password</Label>
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div>
                            <Label>Confirm New Password</Label>
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="bg-slate-700 border-slate-600"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleChangePassword}
                            disabled={!passwords.current || !passwords.new || !passwords.confirm || changePassword.isPending}
                        >
                            Change Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
