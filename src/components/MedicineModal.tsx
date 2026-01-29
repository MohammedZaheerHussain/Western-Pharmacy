// MedicineModal component for Add/Edit medicine
// Supports multi-batch entry with dynamic batch rows

import { useState, useEffect, useRef, useCallback } from 'react';
import { Medicine, MedicineCategory, MEDICINE_CATEGORIES, MedicineLocation, MedicineSchedule, MEDICINE_SCHEDULES } from '../types/medicine';
import { X, ChevronDown, ChevronUp, Clock, Plus, Trash2, Package, ScanLine } from 'lucide-react';
import { generateBatchId } from '../services/storage';
import { MedicineAutocomplete } from './MedicineAutocomplete';
import { MedicineTemplate } from '../data/medicineDatabase';

interface MedicineModalProps {
    isOpen: boolean;
    medicine?: Medicine | null;
    onClose: () => void;
    onSave: (data: MedicineFormData) => Promise<void>;
}

/** Batch entry for the form */
interface BatchEntry {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitPrice: number; // Price per strip for this batch
}

export interface MedicineFormData {
    name: string;
    brand: string;
    salt: string;
    category: MedicineCategory;
    schedule?: MedicineSchedule; // Optional drug schedule
    tabletsPerStrip: number; // Tablets per strip (for loose medicine billing)
    unitPrice: number;
    location: MedicineLocation;
    barcode?: string; // EAN/UPC barcode for scanning (Pro feature)
    // Multi-batch support
    batches: BatchEntry[];
    // Computed from batches
    quantity: number;
    batchNumber: string;
    expiryDate: string;
}

/** Create empty batch entry with default price from medicine */
function createEmptyBatch(defaultPrice: number = 0): BatchEntry {
    return {
        id: generateBatchId(),
        batchNumber: '',
        expiryDate: '',
        quantity: 0,
        unitPrice: defaultPrice
    };
}

const initialFormData: MedicineFormData = {
    name: '',
    brand: '',
    salt: '',
    category: 'Tablet',
    schedule: undefined, // Optional
    tabletsPerStrip: 10, // Default for tablets
    unitPrice: 0,
    location: { rack: '', shelf: '', drawer: '' },
    barcode: '', // Pro feature
    batches: [createEmptyBatch()],
    quantity: 0,
    batchNumber: '',
    expiryDate: ''
};

export function MedicineModal({ isOpen, medicine, onClose, onSave }: MedicineModalProps) {
    const [formData, setFormData] = useState<MedicineFormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof MedicineFormData | 'rack' | 'shelf', string>>>({});
    const [loading, setSaving] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showBatches, setShowBatches] = useState(true);
    const modalRef = useRef<HTMLDivElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Calculate total quantity from batches
    const totalQuantity = formData.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

    // Get earliest expiry from batches
    const earliestExpiry = formData.batches
        .filter(b => b.expiryDate)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0]?.expiryDate || '';

    // Initialize form with medicine data or reset
    useEffect(() => {
        if (isOpen) {
            if (medicine) {
                // Convert medicine to form data
                let batches: BatchEntry[] = [];

                if (medicine.batches && medicine.batches.length > 0) {
                    // Multi-batch medicine - include per-batch prices
                    batches = medicine.batches.map(b => ({
                        id: b.id,
                        batchNumber: b.batchNumber,
                        expiryDate: b.expiryDate,
                        quantity: b.quantity,
                        unitPrice: b.unitPrice || medicine.unitPrice || 0
                    }));
                } else {
                    // Legacy single-batch medicine - convert to batch entry
                    batches = [{
                        id: generateBatchId(),
                        batchNumber: medicine.batchNumber || '',
                        expiryDate: medicine.expiryDate || '',
                        quantity: medicine.quantity || 0,
                        unitPrice: medicine.unitPrice || 0
                    }];
                }

                setFormData({
                    name: medicine.name,
                    brand: medicine.brand,
                    salt: medicine.salt,
                    category: medicine.category,
                    schedule: medicine.schedule,
                    tabletsPerStrip: medicine.tabletsPerStrip || 1,
                    unitPrice: medicine.unitPrice || 0,
                    location: { ...medicine.location },
                    barcode: medicine.barcode || '',
                    batches,
                    quantity: medicine.quantity,
                    batchNumber: medicine.batchNumber,
                    expiryDate: medicine.expiryDate
                });
            } else {
                setFormData({
                    ...initialFormData,
                    batches: [createEmptyBatch()]
                });
            }
            setErrors({});
            setShowAudit(false);
            setShowBatches(true);
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

    // Form validation
    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Medicine name is required';
        }

        // Check at least one batch has quantity
        const hasValidBatch = formData.batches.some(b => b.quantity > 0);
        if (!hasValidBatch && formData.batches.length > 0) {
            // Allow zero quantity for now, just warn
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            // Prepare form data with computed values
            const submitData: MedicineFormData = {
                ...formData,
                quantity: totalQuantity,
                expiryDate: earliestExpiry,
                batchNumber: formData.batches.length === 1 ? formData.batches[0].batchNumber : ''
            };
            await onSave(submitData);
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

    // Handle selection from medicine autocomplete
    const handleAutocompleteSelect = useCallback((template: MedicineTemplate) => {
        setFormData(prev => ({
            ...prev,
            name: template.name,
            brand: template.brand,
            salt: template.salt,
            category: template.category,
            tabletsPerStrip: template.tabletsPerStrip || (template.category === 'Tablet' ? 10 : 1),
            unitPrice: template.suggestedPrice || prev.unitPrice,
            // Update default batch price too
            batches: prev.batches.map((b, idx) =>
                idx === 0 && !b.unitPrice ? { ...b, unitPrice: template.suggestedPrice || 0 } : b
            )
        }));
        // Clear any name error
        if (errors.name) {
            setErrors(prev => ({ ...prev, name: undefined }));
        }
    }, [errors.name]);

    const updateLocation = (field: keyof MedicineLocation, value: string) => {
        setFormData(prev => ({
            ...prev,
            location: { ...prev.location, [field]: value }
        }));
    };

    // Batch management
    const addBatch = () => {
        // Use the last batch's price as default, fallback to form's unitPrice
        const lastBatchPrice = formData.batches.length > 0
            ? formData.batches[formData.batches.length - 1].unitPrice
            : formData.unitPrice;
        setFormData(prev => ({
            ...prev,
            batches: [...prev.batches, createEmptyBatch(lastBatchPrice)]
        }));
    };

    const removeBatch = (batchId: string) => {
        setFormData(prev => ({
            ...prev,
            batches: prev.batches.filter(b => b.id !== batchId)
        }));
    };

    const updateBatch = (batchId: string, field: keyof BatchEntry, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            batches: prev.batches.map(b =>
                b.id === batchId ? { ...b, [field]: value } : b
            )
        }));
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
                className="modal-content bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] 
                   overflow-hidden flex flex-col mx-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {medicine ? 'Edit Medicine' : 'Add Medicine'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="px-6 py-4 space-y-4">
                        {/* Medicine Name - with autocomplete for new medicines */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Medicine Name <span className="text-red-500">*</span>
                            </label>
                            {medicine ? (
                                // Editing existing medicine - use plain input
                                <input
                                    ref={firstInputRef}
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                         focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20`}
                                    placeholder="e.g., Paracetamol 500mg"
                                />
                            ) : (
                                // Adding new medicine - use autocomplete
                                <MedicineAutocomplete
                                    value={formData.name}
                                    onChange={(value) => updateField('name', value)}
                                    onSelect={handleAutocompleteSelect}
                                    placeholder="Type medicine name to search database..."
                                />
                            )}
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        {/* Brand & Salt */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => updateField('brand', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="e.g., Crocin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salt/Composition</label>
                                <input
                                    type="text"
                                    value={formData.salt}
                                    onChange={(e) => updateField('salt', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="e.g., Paracetamol"
                                />
                            </div>
                        </div>

                        {/* Category & Tablets per Strip */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => {
                                        const newCategory = e.target.value as MedicineCategory;
                                        updateField('category', newCategory);
                                        // Auto-set tabletsPerStrip based on category
                                        if (['Tablet', 'Capsule'].includes(newCategory) && formData.tabletsPerStrip === 1) {
                                            updateField('tabletsPerStrip', 10);
                                        } else if (!['Tablet', 'Capsule'].includes(newCategory)) {
                                            updateField('tabletsPerStrip', 1);
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                >
                                    {MEDICINE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tablets per Strip
                                    <span className="text-xs text-gray-400 ml-1">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.tabletsPerStrip}
                                    onChange={(e) => updateField('tabletsPerStrip', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="e.g., 10"
                                />
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formData.tabletsPerStrip > 1
                                        ? `Per tablet: ₹${(formData.unitPrice / formData.tabletsPerStrip).toFixed(2)}`
                                        : 'Unit sale (no loose billing)'}
                                </p>
                            </div>
                        </div>

                        {/* Schedule (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Schedule
                                <span className="text-xs text-gray-400 ml-1">(optional)</span>
                            </label>
                            <select
                                value={formData.schedule || ''}
                                onChange={(e) => updateField('schedule', e.target.value as MedicineSchedule || undefined)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                         focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                            >
                                <option value="">-- Select Schedule --</option>
                                {MEDICINE_SCHEDULES.map(sch => (
                                    <option key={sch.value} value={sch.value} title={sch.description}>
                                        {sch.label} - {sch.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Barcode (Pro Feature) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <span className="flex items-center gap-1.5">
                                    <ScanLine size={14} className="text-amber-500" />
                                    Barcode
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">Pro</span>
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formData.barcode || ''}
                                onChange={(e) => updateField('barcode', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                         focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                placeholder="e.g., 8901234567890"
                            />
                            <p className="text-xs text-gray-400 mt-0.5">EAN-13, EAN-8, UPC-A, or UPC-E barcode for quick scanning</p>
                        </div>

                        {/* Unit Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unit Price (₹/strip)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitPrice}
                                onChange={(e) => updateField('unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                         focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                placeholder="e.g., 12.50"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Location
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={formData.location.rack}
                                    onChange={(e) => updateLocation('rack', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="Rack"
                                />
                                <input
                                    type="text"
                                    value={formData.location.shelf}
                                    onChange={(e) => updateLocation('shelf', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="Shelf"
                                />
                                <input
                                    type="text"
                                    value={formData.location.drawer || ''}
                                    onChange={(e) => updateLocation('drawer', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                                    placeholder="Drawer (opt)"
                                />
                            </div>
                        </div>

                        {/* Batches Section */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowBatches(!showBatches)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={18} className="text-medical-blue" />
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        Batches ({formData.batches.length})
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Total: {totalQuantity} units
                                    </span>
                                </div>
                                {showBatches ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {showBatches && (
                                <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                                    {/* Batch Headers */}
                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                                        <div className="col-span-3">Batch Number</div>
                                        <div className="col-span-3">Expiry Date</div>
                                        <div className="col-span-2">Quantity</div>
                                        <div className="col-span-3">Price (₹/strip)</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {/* Batch Rows */}
                                    {formData.batches.map((batch, index) => (
                                        <div key={batch.id} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                type="text"
                                                value={batch.batchNumber}
                                                onChange={(e) => updateBatch(batch.id, 'batchNumber', e.target.value)}
                                                className="col-span-3 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                                         focus:border-medical-blue focus:ring-1 focus:ring-medical-blue/20"
                                                placeholder={`Batch ${index + 1}`}
                                            />
                                            <input
                                                type="date"
                                                value={batch.expiryDate}
                                                onChange={(e) => updateBatch(batch.id, 'expiryDate', e.target.value)}
                                                className="col-span-3 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                                         focus:border-medical-blue focus:ring-1 focus:ring-medical-blue/20"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                value={batch.quantity}
                                                onChange={(e) => updateBatch(batch.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="col-span-2 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                                         focus:border-medical-blue focus:ring-1 focus:ring-medical-blue/20"
                                                placeholder="Qty"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={batch.unitPrice}
                                                onChange={(e) => updateBatch(batch.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="col-span-3 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                                         focus:border-medical-blue focus:ring-1 focus:ring-medical-blue/20"
                                                placeholder="₹ Price"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeBatch(batch.id)}
                                                disabled={formData.batches.length === 1}
                                                className="col-span-1 p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 
                                                         disabled:cursor-not-allowed transition-colors"
                                                title={formData.batches.length === 1 ? 'At least one batch required' : 'Remove batch'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Batch Button */}
                                    <button
                                        type="button"
                                        onClick={addBatch}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-medical-blue 
                                                 hover:bg-medical-blue/10 rounded-lg transition-colors"
                                    >
                                        <Plus size={16} />
                                        Add Batch
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Audit History (Edit mode only) */}
                        {medicine && medicine.auditHistory.length > 0 && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAudit(!showAudit)}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 
                                             hover:text-gray-900 dark:hover:text-gray-200"
                                >
                                    <Clock size={16} />
                                    Audit History ({medicine.auditHistory.length})
                                    {showAudit ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                {showAudit && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 
                                                  rounded-lg p-3 space-y-2">
                                        {medicine.auditHistory.slice().reverse().map(entry => (
                                            <div key={entry.id} className="text-xs space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                        {entry.action.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500">
                                                        {formatAuditTime(entry.timestamp)}
                                                    </span>
                                                </div>
                                                {entry.changes && entry.changes.map((change, i) => (
                                                    <div key={i} className="text-gray-500 dark:text-gray-400 pl-2">
                                                        {change.field}: {String(change.oldValue)} → {String(change.newValue)}
                                                    </div>
                                                ))}
                                                {entry.note && (
                                                    <div className="text-gray-500 dark:text-gray-400 pl-2 italic">
                                                        {entry.note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                           rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-medical-blue text-white rounded-lg font-medium
                           hover:bg-medical-blue-dark disabled:opacity-60 disabled:cursor-not-allowed
                           transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
