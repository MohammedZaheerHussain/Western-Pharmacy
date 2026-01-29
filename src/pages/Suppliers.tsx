/**
 * Suppliers Page - CRUD for supplier management
 * Pro/Premium feature
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Building,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import {
    getAllSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier
} from '../services/supplierStorage';
import { Supplier, SupplierFormData } from '../types/purchase';
import { validateGSTIN } from '../services/gstService';

interface SuppliersProps {
    formatCurrency: (amount: number) => string;
}

export function Suppliers({ formatCurrency: _formatCurrency }: SuppliersProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);

    // Form state
    const [formData, setFormData] = useState<SupplierFormData>({
        name: '',
        gstin: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        paymentTerms: '',
        notes: ''
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({});
    const [saving, setSaving] = useState(false);

    // Load suppliers
    const loadSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllSuppliers();
            setSuppliers(data);
        } catch (e) {
            console.error('Failed to load suppliers:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    // Filter suppliers
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)
    );

    // Open modal for new/edit
    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                gstin: supplier.gstin || '',
                contactPerson: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email || '',
                address: supplier.address,
                city: supplier.city || '',
                state: supplier.state || '',
                pincode: supplier.pincode || '',
                paymentTerms: supplier.paymentTerms || '',
                notes: supplier.notes || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                gstin: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                paymentTerms: '',
                notes: ''
            });
        }
        setFormErrors({});
        setModalOpen(true);
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof SupplierFormData, string>> = {};

        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
        if (!formData.phone.trim()) errors.phone = 'Phone is required';
        else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, '')))
            errors.phone = 'Invalid phone number';

        if (formData.gstin && formData.gstin.trim()) {
            const gstResult = validateGSTIN(formData.gstin);
            if (!gstResult.valid) errors.gstin = gstResult.error || 'Invalid GSTIN';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            errors.email = 'Invalid email';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save supplier
    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, formData);
            } else {
                await addSupplier(formData);
            }
            await loadSuppliers();
            setModalOpen(false);
        } catch (e) {
            console.error('Failed to save supplier:', e);
        } finally {
            setSaving(false);
        }
    };

    // Delete supplier
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await deleteSupplier(deleteConfirm.id);
            await loadSuppliers();
            setDeleteConfirm(null);
        } catch (e) {
            console.error('Failed to delete supplier:', e);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Suppliers
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your medicine suppliers and vendors
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-medical-blue text-white
                             rounded-lg hover:bg-medical-blue-dark transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Supplier
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search suppliers by name, contact, or phone..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                />
            </div>

            {/* Suppliers List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading suppliers...</div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-12">
                    <Building className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">
                        {search ? 'No suppliers found' : 'No suppliers added yet'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => openModal()}
                            className="mt-3 text-medical-blue hover:underline"
                        >
                            Add your first supplier
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSuppliers.map(supplier => (
                        <div
                            key={supplier.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 
                                     dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {supplier.name}
                                    </h3>
                                    {supplier.gstin && (
                                        <p className="text-xs text-gray-500 font-mono">
                                            GSTIN: {supplier.gstin}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openModal(supplier)}
                                        className="p-1.5 text-gray-400 hover:text-medical-blue 
                                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(supplier)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 
                                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Building size={14} />
                                    <span>{supplier.contactPerson}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Phone size={14} />
                                    <a href={`tel:${supplier.phone}`} className="hover:text-medical-blue">
                                        {supplier.phone}
                                    </a>
                                </div>
                                {supplier.email && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Mail size={14} />
                                        <a href={`mailto:${supplier.email}`} className="hover:text-medical-blue truncate">
                                            {supplier.email}
                                        </a>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{supplier.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Supplier Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${formErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                    placeholder="Company/Supplier name"
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            {/* GSTIN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    GSTIN (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                                    className={`w-full px-3 py-2 rounded-lg border uppercase ${formErrors.gstin ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono`}
                                    placeholder="e.g., 29XXXXX1234X1Z5"
                                    maxLength={15}
                                />
                                {formErrors.gstin && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.gstin}</p>
                                )}
                            </div>

                            {/* Contact Person & Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Contact Person *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border ${formErrors.contactPerson ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                        placeholder="Name"
                                    />
                                    {formErrors.contactPerson && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border ${formErrors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                        placeholder="10 digits"
                                    />
                                    {formErrors.phone && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                    placeholder="email@example.com"
                                />
                                {formErrors.email && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    rows={2}
                                    placeholder="Full address"
                                />
                            </div>

                            {/* City, State, Pincode */}
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="City"
                                />
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="State"
                                />
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="PIN"
                                />
                            </div>

                            {/* Payment Terms */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Payment Terms
                                </label>
                                <select
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">Select...</option>
                                    <option value="COD">Cash on Delivery</option>
                                    <option value="Net 7">Net 7 days</option>
                                    <option value="Net 15">Net 15 days</option>
                                    <option value="Net 30">Net 30 days</option>
                                    <option value="Net 60">Net 60 days</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    rows={2}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                                         dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-medical-blue text-white 
                                         rounded-lg hover:bg-medical-blue-dark transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Check size={16} />
                                        {editingSupplier ? 'Update' : 'Add Supplier'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <AlertCircle className="mx-auto mb-3 text-red-500" size={48} />
                        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
                            Delete Supplier?
                        </h3>
                        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Suppliers;
