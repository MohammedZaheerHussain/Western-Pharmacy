// BillingPanel - Main billing interface for selecting medicines and creating bills

import { useState, useEffect, useMemo } from 'react';
import { Medicine, CartItem, Bill } from '../types/medicine';
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, History, X, AlertCircle } from 'lucide-react';
import { BillReceiptModal } from './BillReceiptModal';
import { BillHistoryModal } from './BillHistoryModal';

interface BillingPanelProps {
    medicines: Medicine[];
    cart: CartItem[];
    discountPercent: number;
    subtotal: number;
    discountAmount: number;
    grandTotal: number;
    bills: Bill[];
    error: string | null;
    loading: boolean;
    onAddToCart: (medicine: Medicine, quantity?: number) => void;
    onRemoveFromCart: (medicineId: string) => void;
    onUpdateQuantity: (medicineId: string, quantity: number) => void;
    onClearCart: () => void;
    onSetDiscount: (percent: number) => void;
    onConfirmBill: () => Promise<Bill>;
    onLoadBills: () => Promise<void>;
    onExportBills: () => void;
    onClearError: () => void;
    onBillComplete: () => void;
}

export function BillingPanel({
    medicines,
    cart,
    discountPercent,
    subtotal,
    discountAmount,
    grandTotal,
    bills,
    error,
    loading,
    onAddToCart,
    onRemoveFromCart,
    onUpdateQuantity,
    onClearCart,
    onSetDiscount,
    onConfirmBill,
    onLoadBills,
    onExportBills,
    onClearError,
    onBillComplete
}: BillingPanelProps) {
    const [search, setSearch] = useState('');
    const [receiptModal, setReceiptModal] = useState<Bill | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load bills on mount
    useEffect(() => {
        onLoadBills();
    }, [onLoadBills]);

    // Filter medicines by search
    const filteredMedicines = useMemo(() => {
        if (!search.trim()) return medicines.filter(m => m.quantity > 0);

        const term = search.toLowerCase();
        return medicines.filter(m =>
            m.quantity > 0 && (
                m.name.toLowerCase().includes(term) ||
                m.brand.toLowerCase().includes(term) ||
                m.salt.toLowerCase().includes(term)
            )
        );
    }, [medicines, search]);

    // Handle confirm bill
    const handleConfirmBill = async () => {
        try {
            const bill = await onConfirmBill();
            setReceiptModal(bill);
            setSuccessMessage(`Bill ${bill.billNumber} created successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch {
            // Error handled by parent
        }
    };

    // Close receipt and refresh inventory
    const handleReceiptClose = () => {
        setReceiptModal(null);
        onBillComplete();
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Medicine Selection */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-medical-blue" />
                            Select Medicines
                        </h2>
                        <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 
                                     hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <History size={16} />
                            <span className="hidden sm:inline">Bill History</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search medicines..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 
                                     focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20"
                        />
                    </div>
                </div>

                {/* Medicine List */}
                <div className="max-h-[400px] overflow-y-auto">
                    {filteredMedicines.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {search ? 'No medicines found' : 'No medicines in stock'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredMedicines.map(medicine => (
                                <div
                                    key={medicine.id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {medicine.brand} • {formatCurrency(medicine.unitPrice)} •
                                            <span className={medicine.quantity < 10 ? 'text-red-600 font-medium' : ''}>
                                                {' '}{medicine.quantity} in stock
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onAddToCart(medicine)}
                                        className="ml-3 flex items-center gap-1 px-3 py-1.5 bg-medical-blue text-white 
                                                 rounded-lg hover:bg-medical-blue-dark transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart & Summary */}
            <div className="lg:w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Receipt size={20} className="text-medical-blue" />
                            Current Bill
                        </h2>
                        {cart.length > 0 && (
                            <button
                                onClick={onClearCart}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <button onClick={onClearError} className="text-red-400 hover:text-red-600">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <ShoppingCart size={40} className="mx-auto mb-2 text-gray-300" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Add medicines from the left</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.medicineId} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{item.medicineName}</p>
                                        <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                                    </div>
                                    <button
                                        onClick={() => onRemoveFromCart(item.medicineId)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onUpdateQuantity(item.medicineId, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white border 
                                                     border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => onUpdateQuantity(item.medicineId, parseInt(e.target.value) || 0)}
                                            min={1}
                                            max={item.availableStock}
                                            className="w-14 text-center py-1 border border-gray-200 rounded-lg"
                                        />
                                        <button
                                            onClick={() => onUpdateQuantity(item.medicineId, item.quantity + 1)}
                                            disabled={item.quantity >= item.availableStock}
                                            className="w-8 h-8 flex items-center justify-center bg-white border 
                                                     border-gray-200 rounded-lg hover:bg-gray-100 transition-colors
                                                     disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <span className="text-xs text-gray-400">
                                            max {item.availableStock}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                        {formatCurrency(item.total)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary & Checkout */}
                {cart.length > 0 && (
                    <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                        {/* Subtotal */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal ({cart.length} items)</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>

                        {/* Discount */}
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-sm text-gray-600">Discount</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={discountPercent}
                                    onChange={(e) => onSetDiscount(parseFloat(e.target.value) || 0)}
                                    min={0}
                                    max={100}
                                    className="w-16 text-center py-1 border border-gray-200 rounded-lg text-sm"
                                />
                                <span className="text-sm text-gray-500">%</span>
                                <span className="text-sm text-gray-400">
                                    (-{formatCurrency(discountAmount)})
                                </span>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                            <span>Grand Total</span>
                            <span className="text-medical-blue">{formatCurrency(grandTotal)}</span>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirmBill}
                            disabled={loading || cart.length === 0}
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
                                    Confirm Bill
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
                />
            )}
        </div>
    );
}
