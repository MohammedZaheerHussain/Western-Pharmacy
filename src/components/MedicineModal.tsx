// MedicineModal component for Add/Edit medicine
// Includes form validation and audit history display

import { useState, useEffect, useRef } from 'react';
import { Medicine, MedicineCategory, MEDICINE_CATEGORIES, MedicineLocation } from '../types/medicine';
import { X, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface MedicineModalProps {
    isOpen: boolean;
    medicine?: Medicine | null;
    onClose: () => void;
    onSave: (data: MedicineFormData) => Promise<void>;
}

export interface MedicineFormData {
    name: string;
    brand: string;
    salt: string;
    category: MedicineCategory;
    quantity: number;
    unitPrice: number;
    location: MedicineLocation;
    batchNumber: string;
    expiryDate: string;
}

const initialFormData: MedicineFormData = {
    name: '',
    brand: '',
    salt: '',
    category: 'Tablet',
    quantity: 0,
    unitPrice: 0,
    location: { rack: '', shelf: '', drawer: '' },
    batchNumber: '',
    expiryDate: ''
};

export function MedicineModal({ isOpen, medicine, onClose, onSave }: MedicineModalProps) {
    const [formData, setFormData] = useState<MedicineFormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof MedicineFormData | 'rack' | 'shelf', string>>>({});
    const [loading, setSaving] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Initialize form with medicine data or reset
    useEffect(() => {
        if (isOpen) {
            if (medicine) {
                setFormData({
                    name: medicine.name,
                    brand: medicine.brand,
                    salt: medicine.salt,
                    category: medicine.category,
                    quantity: medicine.quantity,
                    unitPrice: medicine.unitPrice || 0,
                    location: { ...medicine.location },
                    batchNumber: medicine.batchNumber,
                    expiryDate: medicine.expiryDate
                });
            } else {
                setFormData(initialFormData);
            }
            setErrors({});
            setShowAudit(false);
            // Focus first input after modal opens
            setTimeout(() => firstInputRef.current?.focus(), 100);
        }
    }, [isOpen, medicine]);

    // Handle Escape key to close
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Form validation - only name is required
    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Medicine name is required';
        }
        if (formData.quantity < 0) {
            newErrors.quantity = 'Quantity cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch {
            // Error handled by parent
        } finally {
            setSaving(false);
        }
    };

    const updateField = <K extends keyof MedicineFormData>(
        field: K,
        value: MedicineFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const updateLocation = (field: keyof MedicineLocation, value: string) => {
        setFormData(prev => ({
            ...prev,
            location: { ...prev.location, [field]: value }
        }));
        if (errors[field as 'rack' | 'shelf']) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Format audit timestamp
    const formatAuditTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div
                ref={modalRef}
                className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] 
                   overflow-hidden flex flex-col mx-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                        {medicine ? 'Edit Medicine' : 'Add Medicine'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                       rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="px-6 py-4 space-y-4">
                        {/* Medicine Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Medicine Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={firstInputRef}
                                type="text"
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-300' : 'border-gray-200'}
                           focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20`}
                                placeholder="e.g., Paracetamol 500mg"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        {/* Brand & Salt */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => updateField('brand', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="e.g., Crocin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salt/Composition</label>
                                <input
                                    type="text"
                                    value={formData.salt}
                                    onChange={(e) => updateField('salt', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="e.g., Paracetamol"
                                />
                            </div>
                        </div>

                        {/* Category & Quantity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => updateField('category', e.target.value as MedicineCategory)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20 cursor-pointer"
                                >
                                    {MEDICINE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => updateField('quantity', parseInt(e.target.value) || 0)}
                                    className={`w-full px-3 py-2 rounded-lg border ${errors.quantity ? 'border-red-300' : 'border-gray-200'}
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20`}
                                />
                                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                            </div>
                        </div>

                        {/* Unit Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Price (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitPrice}
                                onChange={(e) => updateField('unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                placeholder="e.g., 12.50"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        value={formData.location.rack}
                                        onChange={(e) => updateLocation('rack', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border ${errors.rack ? 'border-red-300' : 'border-gray-200'}
                               focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20`}
                                        placeholder="Rack"
                                    />
                                    {errors.rack && <p className="text-red-500 text-xs mt-1">{errors.rack}</p>}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.location.shelf}
                                        onChange={(e) => updateLocation('shelf', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border ${errors.shelf ? 'border-red-300' : 'border-gray-200'}
                               focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20`}
                                        placeholder="Shelf"
                                    />
                                    {errors.shelf && <p className="text-red-500 text-xs mt-1">{errors.shelf}</p>}
                                </div>
                                <input
                                    type="text"
                                    value={formData.location.drawer || ''}
                                    onChange={(e) => updateLocation('drawer', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="Drawer (opt)"
                                />
                            </div>
                        </div>

                        {/* Batch & Expiry */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    value={formData.batchNumber}
                                    onChange={(e) => updateField('batchNumber', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="e.g., BATCH001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => updateField('expiryDate', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border ${errors.expiryDate ? 'border-red-300' : 'border-gray-200'}
                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20`}
                                />
                                {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                            </div>
                        </div>

                        {/* Audit History (Edit mode only) */}
                        {medicine && medicine.auditHistory.length > 0 && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAudit(!showAudit)}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <Clock size={16} />
                                    <span>Audit History ({medicine.auditHistory.length})</span>
                                    {showAudit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {showAudit && (
                                    <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2">
                                        {medicine.auditHistory.slice().reverse().map(entry => (
                                            <div key={entry.id} className="text-sm border-b border-gray-200 pb-2 last:border-0">
                                                <div className="flex justify-between text-gray-500">
                                                    <span className="font-medium capitalize">
                                                        {entry.action.replace('_', ' ')}
                                                    </span>
                                                    <span>{formatAuditTime(entry.timestamp)}</span>
                                                </div>
                                                {entry.changes && entry.changes.length > 0 && (
                                                    <ul className="mt-1 text-xs text-gray-600">
                                                        {entry.changes.map((change, idx) => (
                                                            <li key={idx}>
                                                                {change.field}: {String(change.oldValue)} → {String(change.newValue)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {entry.note && (
                                                    <p className="mt-1 text-xs text-gray-500 italic">{entry.note}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (medicine ? 'Save Changes' : 'Add Medicine')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
