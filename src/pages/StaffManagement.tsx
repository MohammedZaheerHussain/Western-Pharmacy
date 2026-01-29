/**
 * Staff Management Page
 * Premium feature for managing staff members and roles
 */

import { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { StaffMember, UserRole, ROLE_DISPLAY } from '../types/user';
import {
    Users, Plus, Edit2, Trash2, X, Check, Shield,
    Mail, Phone, Key, User, Clock
} from 'lucide-react';

interface StaffFormData {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    pin: string;
    isActive: boolean;
}

const initialFormData: StaffFormData = {
    name: '',
    email: '',
    phone: '',
    role: 'pharmacist',
    pin: '',
    isActive: true
};

export function StaffManagement() {
    const { staff, currentUser, addStaff, updateStaff, removeStaff, permissions } = useRole();

    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [formData, setFormData] = useState<StaffFormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

    // Filter staff
    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || s.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Open modal for add/edit
    const openModal = (staffMember?: StaffMember) => {
        if (staffMember) {
            setEditingStaff(staffMember);
            setFormData({
                name: staffMember.name,
                email: staffMember.email,
                phone: staffMember.phone || '',
                role: staffMember.role,
                pin: '', // Don't show existing PIN
                isActive: staffMember.isActive
            });
        } else {
            setEditingStaff(null);
            setFormData(initialFormData);
        }
        setErrors({});
        setShowModal(true);
    };

    // Validate form
    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        } else if (!editingStaff && staff.some(s => s.email === formData.email)) {
            newErrors.email = 'Email already exists';
        }

        if (formData.pin && !/^\d{4}$/.test(formData.pin)) {
            newErrors.pin = 'PIN must be 4 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            if (editingStaff) {
                await updateStaff(editingStaff.id, {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    role: formData.role,
                    pin: formData.pin || editingStaff.pin,
                    isActive: formData.isActive
                });
            } else {
                await addStaff({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    role: formData.role,
                    pin: formData.pin || undefined,
                    isActive: formData.isActive
                });
            }
            setShowModal(false);
        } catch (e) {
            console.error('Failed to save staff:', e);
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        try {
            await removeStaff(id);
            setDeleteConfirm(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to remove staff');
        }
    };

    // Format date
    const formatDate = (date?: string) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!permissions.canManageStaff) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Access Restricted
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        You don't have permission to manage staff.
                        <br />
                        Contact your pharmacy owner for access.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Users className="text-purple-500" />
                        Staff Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage team members and their access levels
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 
                             text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 
                             transition-all shadow-md"
                >
                    <Plus size={18} />
                    Add Staff
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                    <option value="all">All Roles</option>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="cashier">Cashier</option>
                </select>
            </div>

            {/* Staff Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStaff.map(member => (
                    <div
                        key={member.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl border ${member.id === currentUser?.id
                            ? 'border-purple-300 dark:border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700'
                            } p-5 relative transition-shadow hover:shadow-md`}
                    >
                        {/* Current user badge */}
                        {member.id === currentUser?.id && (
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium 
                                           bg-purple-500 text-white rounded-full">
                                You
                            </span>
                        )}

                        {/* Status indicator */}
                        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${member.isActive ? 'bg-green-400' : 'bg-gray-300'
                            }`} title={member.isActive ? 'Active' : 'Inactive'} />

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 
                                          flex items-center justify-center text-white font-bold text-lg">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {member.name}
                                </h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_DISPLAY[member.role].color
                                    }`}>
                                    {ROLE_DISPLAY[member.role].label}
                                </span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span className="truncate">{member.email}</span>
                            </div>
                            {member.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} />
                                    <span>{member.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>Last login: {formatDate(member.lastLogin)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => openModal(member)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 
                                         text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 
                                         dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 
                                         rounded-lg transition-colors"
                            >
                                <Edit2 size={14} />
                                Edit
                            </button>

                            {member.role !== 'owner' && member.id !== currentUser?.id && (
                                deleteConfirm === member.id ? (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg 
                                                     hover:bg-red-600 transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 
                                                     text-gray-700 dark:text-gray-300 rounded-lg 
                                                     hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(member.id)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 
                                                 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 
                                                 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery || roleFilter !== 'all'
                            ? 'No staff members match your filters'
                            : 'No staff members yet'}
                    </p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="px-6 py-4 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className={`w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'} 
                                                 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                        placeholder="e.g., John Doe"
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'} 
                                                 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                        placeholder="e.g., john@example.com"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 
                                                 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder="e.g., 9876543210"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                                        disabled={editingStaff?.role === 'owner'}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 
                                                 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                                 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="owner">Owner - Full access</option>
                                        <option value="manager">Manager - All except settings</option>
                                        <option value="pharmacist">Pharmacist - Billing + Inventory</option>
                                        <option value="cashier">Cashier - Billing only</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {ROLE_DISPLAY[formData.role].description}
                                </p>
                            </div>

                            {/* PIN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Quick Switch PIN
                                    <span className="text-xs text-gray-400 ml-1">(optional, 4 digits)</span>
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={formData.pin}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                                        className={`w-full pl-10 pr-3 py-2 border ${errors.pin ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'} 
                                                 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                        placeholder="••••"
                                    />
                                </div>
                                {errors.pin && <p className="text-red-500 text-sm mt-1">{errors.pin}</p>}
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                                  peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full 
                                                  peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                                                  peer-checked:after:border-white after:content-[''] after:absolute 
                                                  after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                                                  after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                                                  dark:border-gray-600 peer-checked:bg-purple-500" />
                                </label>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {formData.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 
                                         text-gray-700 dark:text-gray-300 rounded-lg font-medium 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 
                                         text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 
                                         disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? 'Saving...' : (editingStaff ? 'Update' : 'Add Staff')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
