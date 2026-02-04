/**
 * PurchaseOrderModal - Create/Edit Purchase Orders
 * For stock-in from suppliers
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Package, Calculator, AlertCircle } from 'lucide-react';
import { Supplier, PurchaseOrder, PurchaseItem, PurchaseItemFormData } from '../types/purchase';
import { getAllSuppliers, getNextPONumber, createPurchase } from '../services/supplierStorage';
import { getAllMedicines } from '../services/storage';
import { Medicine } from '../types/medicine';

interface PurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editPurchase?: PurchaseOrder;
}

// Empty item form template
const emptyItem: PurchaseItemFormData = {
    medicineName: '',
    brand: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 1,
    freeQuantity: 0,
    purchasePrice: 0,
    mrp: 0,
    discountPercent: 0,
    gstRate: 12
};

// Calculate item totals
function calculateItemTotals(item: PurchaseItemFormData): Omit<PurchaseItem, 'id' | 'medicineId'> {
    const grossAmount = item.quantity * item.purchasePrice;
    const discountAmount = (grossAmount * item.discountPercent) / 100;
    const netAmount = grossAmount - discountAmount;
    const gstAmount = (netAmount * item.gstRate) / 100;
    const totalAmount = netAmount + gstAmount;

    return {
        medicineName: item.medicineName,
        brand: item.brand,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        freeQuantity: item.freeQuantity,
        purchasePrice: item.purchasePrice,
        mrp: item.mrp,
        discountPercent: item.discountPercent,
        gstRate: item.gstRate,
        netAmount,
        gstAmount,
        totalAmount
    };
}

export function PurchaseOrderModal({ isOpen, onClose, onSuccess, editPurchase }: PurchaseOrderModalProps) {
    // Supplier and PO info
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [poNumber, setPoNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Items
    const [items, setItems] = useState<PurchaseItemFormData[]>([{ ...emptyItem }]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Suggestions for medicine autocomplete
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

    // Load suppliers and medicines
    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [supplierData, medicineData, poNum] = await Promise.all([
                    getAllSuppliers(),
                    getAllMedicines(),
                    getNextPONumber()
                ]);
                setSuppliers(supplierData.filter(s => s.isActive));
                setMedicines(medicineData);
                setPoNumber(poNum);

                // If editing, populate form
                if (editPurchase) {
                    setSelectedSupplierId(editPurchase.supplierId);
                    setPoNumber(editPurchase.poNumber);
                    setInvoiceNumber(editPurchase.invoiceNumber || '');
                    setInvoiceDate(editPurchase.invoiceDate || '');
                    setReceivedDate(editPurchase.receivedDate);
                    setNotes(editPurchase.notes || '');
                    setItems(editPurchase.items.map(item => ({
                        medicineName: item.medicineName,
                        brand: item.brand,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                        quantity: item.quantity,
                        freeQuantity: item.freeQuantity,
                        purchasePrice: item.purchasePrice,
                        mrp: item.mrp,
                        discountPercent: item.discountPercent,
                        gstRate: item.gstRate
                    })));
                }
            } catch (e) {
                console.error('Failed to load data:', e);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, editPurchase]);

    // Add new item row
    const addItem = useCallback(() => {
        setItems(prev => [...prev, { ...emptyItem }]);
    }, []);

    // Remove item row
    const removeItem = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Update item field
    const updateItem = useCallback((index: number, field: keyof PurchaseItemFormData, value: string | number) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }, []);

    // Calculate totals
    const calculatedItems = items.map(item => calculateItemTotals(item));
    const subtotal = calculatedItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    const totalDiscount = calculatedItems.reduce((sum, item) => {
        const gross = item.quantity * item.purchasePrice;
        return sum + (gross * item.discountPercent / 100);
    }, 0);
    const taxableValue = calculatedItems.reduce((sum, item) => sum + item.netAmount, 0);
    const totalGst = calculatedItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const grandTotal = calculatedItems.reduce((sum, item) => sum + item.totalAmount, 0);

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!selectedSupplierId) {
            setError('Please select a supplier');
            return;
        }

        if (items.length === 0 || !items[0].medicineName) {
            setError('Please add at least one item');
            return;
        }

        // Validate all items have required fields
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.medicineName) {
                setError(`Item ${i + 1}: Medicine name is required`);
                return;
            }
            if (!item.batchNumber) {
                setError(`Item ${i + 1}: Batch number is required`);
                return;
            }
            if (!item.expiryDate) {
                setError(`Item ${i + 1}: Expiry date is required`);
                return;
            }
            if (item.quantity <= 0) {
                setError(`Item ${i + 1}: Quantity must be greater than 0`);
                return;
            }
        }

        setSubmitting(true);

        try {
            const supplier = suppliers.find(s => s.id === selectedSupplierId);

            const purchaseItems: PurchaseItem[] = calculatedItems.map((item, index) => ({
                id: `item_${Date.now()}_${index}`,
                medicineId: undefined, // Will be linked when receiving
                ...item
            }));

            await createPurchase({
                poNumber,
                supplierId: selectedSupplierId,
                supplierName: supplier?.name || '',
                invoiceNumber: invoiceNumber || undefined,
                invoiceDate: invoiceDate || undefined,
                receivedDate,
                items: purchaseItems,
                subtotal,
                totalDiscount,
                taxableValue,
                gstAmount: totalGst,
                roundOff: Math.round(grandTotal) - grandTotal,
                grandTotal: Math.round(grandTotal),
                paymentStatus: 'pending',
                paidAmount: 0,
                balanceAmount: Math.round(grandTotal),
                status: 'confirmed',
                notes: notes || undefined
            });

            onSuccess();
            onClose();
        } catch (e) {
            console.error('Failed to create purchase:', e);
            setError('Failed to create purchase order');
        } finally {
            setSubmitting(false);
        }
    };

    // Medicine suggestions for autocomplete
    const getMedicineSuggestions = (query: string) => {
        if (!query || query.length < 2) return [];
        return medicines
            .filter(m =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.brand?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editPurchase ? 'Edit Purchase Order' : 'New Purchase Order'}
                            </h2>
                            <p className="text-sm text-gray-500">{poNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="mx-auto mb-3 text-amber-500" size={48} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No Suppliers Found
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Please add suppliers before creating a purchase order
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Supplier & Invoice Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Supplier *
                                    </label>
                                    <select
                                        value={selectedSupplierId}
                                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        required
                                    >
                                        <option value="">Select supplier...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="Supplier invoice #"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Invoice Date
                                    </label>
                                    <input
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Received Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={receivedDate}
                                        onChange={(e) => setReceivedDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900 dark:text-white">Purchase Items</h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                    >
                                        <Plus size={16} />
                                        Add Item
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Medicine Name *</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400 w-24">Batch *</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400 w-28">Expiry *</th>
                                                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16">Qty</th>
                                                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16">Free</th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400 w-24">Price</th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400 w-24">MRP</th>
                                                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16">Disc%</th>
                                                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16">GST%</th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400 w-24">Total</th>
                                                <th className="px-3 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {items.map((item, index) => {
                                                const calculated = calculatedItems[index];
                                                const suggestions = activeSuggestionIndex === index
                                                    ? getMedicineSuggestions(item.medicineName)
                                                    : [];

                                                return (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="px-3 py-2 relative">
                                                            <input
                                                                type="text"
                                                                value={item.medicineName}
                                                                onChange={(e) => {
                                                                    updateItem(index, 'medicineName', e.target.value);
                                                                    setActiveSuggestionIndex(index);
                                                                }}
                                                                onBlur={() => setTimeout(() => setActiveSuggestionIndex(null), 200)}
                                                                placeholder="Medicine name"
                                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                required
                                                            />
                                                            {suggestions.length > 0 && (
                                                                <div className="absolute left-3 right-3 top-full z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                                                                    {suggestions.map(med => (
                                                                        <button
                                                                            key={med.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                updateItem(index, 'medicineName', med.name);
                                                                                updateItem(index, 'brand', med.brand || '');
                                                                                updateItem(index, 'mrp', med.unitPrice);
                                                                                setActiveSuggestionIndex(null);
                                                                            }}
                                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                        >
                                                                            <span className="font-medium">{med.name}</span>
                                                                            {med.brand && <span className="text-gray-500 ml-2">({med.brand})</span>}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={item.batchNumber}
                                                                onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                                                                placeholder="Batch"
                                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="month"
                                                                value={item.expiryDate}
                                                                onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                                min="1"
                                                                className="w-full px-2 py-1.5 text-sm text-center rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={item.freeQuantity}
                                                                onChange={(e) => updateItem(index, 'freeQuantity', Number(e.target.value))}
                                                                min="0"
                                                                className="w-full px-2 py-1.5 text-sm text-center rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={item.purchasePrice}
                                                                onChange={(e) => updateItem(index, 'purchasePrice', Number(e.target.value))}
                                                                min="0"
                                                                step="0.01"
                                                                className="w-full px-2 py-1.5 text-sm text-right rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={item.mrp}
                                                                onChange={(e) => updateItem(index, 'mrp', Number(e.target.value))}
                                                                min="0"
                                                                step="0.01"
                                                                className="w-full px-2 py-1.5 text-sm text-right rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={item.discountPercent}
                                                                onChange={(e) => updateItem(index, 'discountPercent', Number(e.target.value))}
                                                                min="0"
                                                                max="100"
                                                                className="w-full px-2 py-1.5 text-sm text-center rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <select
                                                                value={item.gstRate}
                                                                onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value))}
                                                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600
                                                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                            >
                                                                <option value={0}>0%</option>
                                                                <option value={5}>5%</option>
                                                                <option value={12}>12%</option>
                                                                <option value={18}>18%</option>
                                                                <option value={28}>28%</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                            ₹{calculated.totalAmount.toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    className="p-1 text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-72 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Total Discount</span>
                                        <span>-₹{totalDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>Taxable Value</span>
                                        <span>₹{taxableValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>GST</span>
                                        <span>₹{totalGst.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                                        <span>Grand Total</span>
                                        <span>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Any additional notes..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                {!loading && suppliers.length > 0 && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Calculator size={18} />
                                    Create Purchase
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PurchaseOrderModal;
