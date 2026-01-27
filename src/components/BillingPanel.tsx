/**
 * BillingPanel - Main billing interface for selling medicines
 * Features: New Bill, edit mode, low-stock warnings, confirm dialogs
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Medicine, CartItem, Bill } from '../types/medicine';
import {
    Search, Plus, Minus, Trash2, ShoppingCart, Receipt, History,
    X, AlertCircle, AlertTriangle, FilePlus, CheckCircle
} from 'lucide-react';
import { BillReceiptModal } from './BillReceiptModal';
import { BillHistoryModal } from './BillHistoryModal';
import { LOW_STOCK_THRESHOLD } from '../hooks/useBilling';

// ============ INLINE SUB-COMPONENTS ============

/** Medicine row in selection list */
const MedicineRow = React.memo(function MedicineRow({
    medicine,
    onAdd,
    formatCurrency
}: {
    medicine: Medicine;
    onAdd: () => void;
    formatCurrency: (n: number) => string;
}) {
    const isLowStock = medicine.quantity < LOW_STOCK_THRESHOLD && medicine.quantity > 0;

    return (
        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{medicine.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {medicine.brand} • {formatCurrency(medicine.unitPrice)} •
                    <span className={isLowStock ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                        {' '}{medicine.quantity} in stock
                    </span>
                    {isLowStock && <AlertTriangle size={12} className="inline ml-1 text-amber-500" />}
                </p>
            </div>
            <button
                onClick={onAdd}
                className="ml-3 flex items-center gap-1 px-3 py-1.5 bg-medical-blue text-white 
                         rounded-lg hover:bg-medical-blue-dark transition-colors text-sm font-medium"
                aria-label={`Add ${medicine.name} to cart`}
            >
                <Plus size={16} />
                Add
            </button>
        </div>
    );
});

/** Cart item row with strip/loose tablet quantity controls */
const CartRow = React.memo(function CartRow({
    item,
    isEditMode,
    onRemove,
    onUpdateStripLoose,
    formatCurrency
}: {
    item: CartItem & { originalQuantity?: number };
    isEditMode: boolean;
    onRemove: () => void;
    onUpdateStripLoose: (stripQty: number, looseQty: number) => void;
    formatCurrency: (n: number) => string;
}) {
    const tabletsPerStrip = item.tabletsPerStrip || 1;
    const hasLooseBilling = tabletsPerStrip > 1;
    const perTabletPrice = hasLooseBilling ? item.unitPrice / tabletsPerStrip : item.unitPrice;

    // Calculate if this will leave low stock
    const effectiveMax = isEditMode && item.originalQuantity
        ? item.availableStock + item.originalQuantity
        : item.availableStock;
    const postSale = effectiveMax - item.quantity;
    const isLowStockAfter = postSale > 0 && postSale < LOW_STOCK_THRESHOLD;
    const isRemoved = isEditMode && item.quantity === 0;

    // Calculate max strips possible
    const maxStrips = Math.floor(effectiveMax / tabletsPerStrip);
    const maxLoose = tabletsPerStrip - 1;

    return (
        <div className={`rounded-lg p-3 ${isRemoved
            ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            : isLowStockAfter
                ? 'low-stock-warning'
                : 'bg-gray-50 dark:bg-gray-800'
            }`}>
            {/* Header with name and prices */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isRemoved ? 'text-red-600 dark:text-red-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {item.medicineName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.unitPrice)}/strip
                        {hasLooseBilling && (
                            <span className="text-medical-blue"> • {formatCurrency(perTabletPrice)}/tablet</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 p-1"
                    title={isEditMode ? "Set quantity to 0 (will restock)" : "Remove"}
                    aria-label="Remove item"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Two-field quantity input */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Strips input */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Strips</label>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onUpdateStripLoose(Math.max(0, (item.stripQty || 0) - 1), item.looseQty || 0)}
                                disabled={!isEditMode && (item.stripQty || 0) <= 0 && (item.looseQty || 0) <= 1}
                                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border 
                                         border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 
                                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                aria-label="Decrease strips"
                            >
                                <Minus size={12} />
                            </button>
                            <input
                                type="number"
                                value={item.stripQty || 0}
                                onChange={(e) => onUpdateStripLoose(parseInt(e.target.value) || 0, item.looseQty || 0)}
                                min={0}
                                max={maxStrips}
                                className="w-12 text-center py-1 text-sm border border-gray-200 dark:border-gray-600 
                                         rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                aria-label="Full strips"
                            />
                            <button
                                onClick={() => onUpdateStripLoose((item.stripQty || 0) + 1, item.looseQty || 0)}
                                disabled={(item.stripQty || 0) >= maxStrips && (item.looseQty || 0) >= maxLoose}
                                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border 
                                         border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 
                                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                aria-label="Increase strips"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Loose tablets input - only show if tabletsPerStrip > 1 */}
                    {hasLooseBilling && (
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                Loose <span className="opacity-70">(0-{maxLoose})</span>
                            </label>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onUpdateStripLoose(item.stripQty || 0, Math.max(0, (item.looseQty || 0) - 1))}
                                    disabled={(item.looseQty || 0) <= 0}
                                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border 
                                             border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 
                                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    aria-label="Decrease loose tablets"
                                >
                                    <Minus size={12} />
                                </button>
                                <input
                                    type="number"
                                    value={item.looseQty || 0}
                                    onChange={(e) => onUpdateStripLoose(item.stripQty || 0, parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={maxLoose}
                                    className="w-10 text-center py-1 text-sm border border-gray-200 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    aria-label="Loose tablets"
                                />
                                <button
                                    onClick={() => onUpdateStripLoose(item.stripQty || 0, Math.min(maxLoose, (item.looseQty || 0) + 1))}
                                    disabled={(item.looseQty || 0) >= maxLoose}
                                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border 
                                             border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 
                                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    aria-label="Increase loose tablets"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Total and summary */}
                <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.quantity} {hasLooseBilling ? 'tablets' : 'units'}
                        {hasLooseBilling && (item.stripQty || 0) > 0 && (item.looseQty || 0) > 0 && (
                            <span className="block">
                                ({item.stripQty} strip{(item.stripQty || 0) !== 1 ? 's' : ''} + {item.looseQty} loose)
                            </span>
                        )}
                    </p>
                    {isLowStockAfter && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                            <AlertTriangle size={10} />
                            {postSale} left
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

/** Confirm dialog inline component */
function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger'
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning';
}) {
    if (!open) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${variant === 'danger'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============ MAIN COMPONENT ============

interface BillingPanelProps {
    medicines: Medicine[];
    cart: CartItem[];
    discountPercent: number;
    subtotal: number;
    discountAmount: number;
    grandTotal: number;
    customerName: string;
    customerPhone: string;
    bills: Bill[];
    error: string | null;
    successMessage: string | null;
    loading: boolean;
    editingBill: Bill | null;
    isEditMode: boolean;
    gstEnabled: boolean;
    gstPercentage: number;
    onAddToCart: (medicine: Medicine, quantity?: number) => void;
    onRemoveFromCart: (medicineId: string) => void;
    onUpdateQuantity: (medicineId: string, quantity: number) => void;
    onUpdateStripLooseQty: (medicineId: string, stripQty: number, looseQty: number) => void;
    onClearCart: () => void;
    onSetDiscount: (percent: number) => void;
    onSetCustomerName: (name: string) => void;
    onSetCustomerPhone: (phone: string) => void;
    onConfirmBill: () => Promise<Bill>;
    onLoadBills: () => Promise<void>;
    onExportBills: () => void;
    onClearError: () => void;
    onClearSuccess: () => void;
    onBillComplete: () => void;
    onEditBill: (bill: Bill) => void;
    onCancelEdit: () => void;
}

export function BillingPanel({
    medicines,
    cart,
    discountPercent,
    subtotal,
    discountAmount,
    grandTotal,
    customerName,
    customerPhone,
    bills,
    error,
    successMessage,
    loading,
    editingBill,
    isEditMode,
    gstEnabled,
    gstPercentage,
    onAddToCart,
    onRemoveFromCart,
    onUpdateQuantity: _onUpdateQuantity, // Kept for backwards compat, use onUpdateStripLooseQty
    onUpdateStripLooseQty,
    onClearCart,
    onSetDiscount,
    onSetCustomerName,
    onSetCustomerPhone,
    onConfirmBill,
    onLoadBills,
    onExportBills,
    onClearError,
    onClearSuccess,
    onBillComplete,
    onEditBill,
    onCancelEdit
}: BillingPanelProps) {
    const [search, setSearch] = useState('');
    const [receiptModal, setReceiptModal] = useState<Bill | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'newBill' | 'cancelEdit' | 'removeItem';
        itemId?: string;
    }>({ open: false, type: 'newBill' });

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load bills on mount
    useEffect(() => {
        onLoadBills();
    }, [onLoadBills]);

    // Filter medicines by search (only show in-stock for non-edit mode)
    const filteredMedicines = useMemo(() => {
        const inStock = medicines.filter(m => m.quantity > 0);
        if (!search.trim()) return inStock;

        const term = search.toLowerCase();
        return inStock.filter(m =>
            m.name.toLowerCase().includes(term) ||
            m.brand.toLowerCase().includes(term) ||
            m.salt.toLowerCase().includes(term)
        );
    }, [medicines, search]);

    /** Format currency in INR */
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }, []);

    /** Handle confirm bill */
    const handleConfirmBill = useCallback(async () => {
        try {
            const bill = await onConfirmBill();
            setReceiptModal(bill);
        } catch {
            // Error handled by parent
        }
    }, [onConfirmBill]);

    /** Close receipt and refresh inventory */
    const handleReceiptClose = useCallback(() => {
        setReceiptModal(null);
        onBillComplete();
    }, [onBillComplete]);

    /** Handle New Bill button */
    const handleNewBill = useCallback(() => {
        if (cart.length > 0 || isEditMode) {
            setConfirmDialog({ open: true, type: isEditMode ? 'cancelEdit' : 'newBill' });
        } else {
            searchInputRef.current?.focus();
        }
    }, [cart.length, isEditMode]);

    /** Confirm new bill / cancel edit */
    const handleConfirmNewBill = useCallback(() => {
        if (isEditMode) {
            onCancelEdit();
        } else {
            onClearCart();
        }
        setConfirmDialog({ open: false, type: 'newBill' });
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }, [isEditMode, onCancelEdit, onClearCart]);

    /** Handle remove with confirmation in edit mode */
    const handleRemove = useCallback((medicineId: string) => {
        if (isEditMode) {
            setConfirmDialog({ open: true, type: 'removeItem', itemId: medicineId });
        } else {
            onRemoveFromCart(medicineId);
        }
    }, [isEditMode, onRemoveFromCart]);

    /** Confirm remove in edit mode */
    const handleConfirmRemove = useCallback(() => {
        if (confirmDialog.itemId) {
            onRemoveFromCart(confirmDialog.itemId);
        }
        setConfirmDialog({ open: false, type: 'newBill' });
    }, [confirmDialog.itemId, onRemoveFromCart]);

    /** Handle edit bill from history */
    const handleEditFromHistory = useCallback((bill: Bill) => {
        setShowHistory(false);
        onEditBill(bill);
    }, [onEditBill]);

    // Active cart items (exclude qty=0 in edit mode for display purposes)
    const displayCart = isEditMode ? cart : cart.filter(item => item.quantity > 0);
    // Note: displayCart used below in cart section

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Medicine Selection - 50% width */}
            <div className="flex-1 lg:w-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-medical-blue" />
                            {isEditMode ? 'Editing Bill' : 'Select Medicines'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNewBill}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-medical-blue 
                                         hover:bg-medical-blue/10 rounded-lg transition-colors font-medium"
                                aria-label="Start new bill"
                            >
                                <FilePlus size={16} />
                                <span className="hidden sm:inline">New Bill</span>
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 
                                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="View bill history"
                            >
                                <History size={16} />
                                <span className="hidden sm:inline">History</span>
                            </button>
                        </div>
                    </div>

                    {/* Edit mode banner */}
                    {isEditMode && editingBill && (
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 
                                      rounded-lg flex items-center justify-between">
                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                Editing {editingBill.billNumber} - Save to update stock & totals
                            </span>
                            <button
                                onClick={() => setConfirmDialog({ open: true, type: 'cancelEdit' })}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search medicines..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                     focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                            aria-label="Search medicines"
                        />
                    </div>
                </div>

                {/* Medicine List */}
                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[60vh]">
                    {filteredMedicines.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            {search ? 'No medicines found' : 'No medicines in stock'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredMedicines.map(medicine => (
                                <MedicineRow
                                    key={medicine.id}
                                    medicine={medicine}
                                    onAdd={() => onAddToCart(medicine)}
                                    formatCurrency={formatCurrency}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart & Summary - 50% width */}
            <div className="flex-1 lg:w-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Receipt size={20} className="text-medical-blue" />
                            {isEditMode ? `Edit ${editingBill?.billNumber}` : 'Current Bill'}
                        </h2>
                        {cart.length > 0 && !isEditMode && (
                            <button
                                onClick={() => setConfirmDialog({ open: true, type: 'newBill' })}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className={`mx-4 mt-3 p-3 rounded-lg flex items-start gap-2 ${error.startsWith('Warning')
                        ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                        : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                        }`}>
                        {error.startsWith('Warning')
                            ? <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            : <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        }
                        <div className="flex-1">
                            <p className={`text-sm ${error.startsWith('Warning') ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
                                {error}
                            </p>
                        </div>
                        <button onClick={onClearError} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mx-4 mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 
                                  rounded-lg flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-700 dark:text-green-300 flex-1">{successMessage}</p>
                        <button onClick={onClearSuccess} className="text-green-400 hover:text-green-600">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Customer Details (Optional) */}
                    {(cart.length > 0 || isEditMode) && (
                        <div className="mb-4 space-y-3">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Details (Optional)</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => onSetCustomerName(e.target.value)}
                                    placeholder="Customer Name"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                />
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => onSetCustomerPhone(e.target.value)}
                                    placeholder="Phone Number"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {displayCart.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <ShoppingCart size={40} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Add medicines from the left</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <CartRow
                                key={item.medicineId}
                                item={item as CartItem & { originalQuantity?: number }}
                                isEditMode={isEditMode}
                                onRemove={() => handleRemove(item.medicineId)}
                                onUpdateStripLoose={(stripQty, looseQty) => onUpdateStripLooseQty(item.medicineId, stripQty, looseQty)}
                                formatCurrency={formatCurrency}
                            />
                        ))
                    )}
                </div>

                {/* Summary & Checkout */}
                {(cart.length > 0 || isEditMode) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                        {/* Subtotal */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal ({cart.filter(i => i.quantity > 0).length} items)</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                        </div>

                        {/* Discount */}
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Discount</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={discountPercent}
                                    onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0)}
                                    min={0}
                                    max={100}
                                    className="w-16 text-center py-1 border border-gray-200 dark:border-gray-600 
                                             rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    aria-label="Discount percentage"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                    (-{formatCurrency(discountAmount)})
                                </span>
                            </div>
                        </div>

                        {/* GST (when enabled) */}
                        {gstEnabled && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    GST ({gstPercentage}%)
                                </span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    +{formatCurrency((subtotal - discountAmount) * gstPercentage / 100)}
                                </span>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                            <span className="text-gray-900 dark:text-gray-100">Grand Total</span>
                            <span className="text-medical-blue">
                                {formatCurrency(
                                    gstEnabled
                                        ? grandTotal + (subtotal - discountAmount) * gstPercentage / 100
                                        : grandTotal
                                )}
                            </span>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirmBill}
                            disabled={loading || (cart.filter(i => i.quantity > 0).length === 0 && !isEditMode)}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold
                                     hover:bg-green-700 transition-colors disabled:opacity-50 
                                     disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Receipt size={20} />
                                    {isEditMode ? 'Update Bill' : 'Confirm Bill'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {receiptModal && (
                <BillReceiptModal
                    bill={receiptModal}
                    onClose={handleReceiptClose}
                />
            )}

            {/* Bill History Modal */}
            {showHistory && (
                <BillHistoryModal
                    bills={bills}
                    onClose={() => setShowHistory(false)}
                    onExport={onExportBills}
                    onViewBill={(bill) => {
                        setShowHistory(false);
                        setReceiptModal(bill);
                    }}
                    onEditBill={handleEditFromHistory}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={
                    confirmDialog.type === 'removeItem'
                        ? 'Remove Item?'
                        : confirmDialog.type === 'cancelEdit'
                            ? 'Cancel Editing?'
                            : 'Start New Bill?'
                }
                message={
                    confirmDialog.type === 'removeItem'
                        ? 'Set quantity to 0? This will restock the item when you save.'
                        : confirmDialog.type === 'cancelEdit'
                            ? 'Discard all changes and cancel editing?'
                            : 'Discard current bill and start fresh?'
                }
                confirmLabel={confirmDialog.type === 'removeItem' ? 'Remove' : 'Discard'}
                onConfirm={confirmDialog.type === 'removeItem' ? handleConfirmRemove : handleConfirmNewBill}
                onCancel={() => setConfirmDialog({ open: false, type: 'newBill' })}
                variant={confirmDialog.type === 'removeItem' ? 'warning' : 'danger'}
            />
        </div>
    );
}
