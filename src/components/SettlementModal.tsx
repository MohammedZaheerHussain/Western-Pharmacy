/**
 * End of Day Settlement Modal
 * Premium feature for cash reconciliation
 */

import { useState, useEffect } from 'react';
import { Settlement } from '../types/user';
import { Bill } from '../types/medicine';
import { getAllBills } from '../services/storage';
import {
    X, Calculator, IndianRupee, CreditCard, Smartphone,
    FileText, CheckCircle, AlertCircle, Clock
} from 'lucide-react';

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (settlement: Settlement) => void;
    currentUserName: string;
    formatCurrency: (amount: number) => string;
}

export function SettlementModal({
    isOpen,
    onClose,
    onComplete,
    currentUserName,
    formatCurrency
}: SettlementModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Calculated values
    const [todayBills, setTodayBills] = useState<Bill[]>([]);
    const [expectedCash, setExpectedCash] = useState(0);
    const [paymentBreakdown, setPaymentBreakdown] = useState({
        cash: 0,
        card: 0,
        upi: 0,
        credit: 0
    });

    // User inputs
    const [openingCash, setOpeningCash] = useState(0);
    const [actualCash, setActualCash] = useState(0);
    const [notes, setNotes] = useState('');

    // Load today's bills
    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const allBills = await getAllBills();

                // Filter today's bills
                const today = new Date().toISOString().split('T')[0];
                const todaysBills = allBills.filter(bill => {
                    const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
                    return billDate === today; // Include all bills (Bill type has no status field)
                });

                setTodayBills(todaysBills);

                // Calculate payment breakdown
                const breakdown = {
                    cash: 0,
                    card: 0,
                    upi: 0,
                    credit: 0
                };

                todaysBills.forEach(bill => {
                    // Current Bill type doesn't have paymentMethod - assume cash for now
                    breakdown.cash += bill.grandTotal;
                });

                setPaymentBreakdown(breakdown);
                setExpectedCash(breakdown.cash);
                setActualCash(breakdown.cash); // Default to expected
            } catch (e) {
                console.error('Failed to load bills:', e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen]);

    // Calculate totals
    const totalSales = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalDiscount = todayBills.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
    const totalTax = 0; // Bill type doesn't have taxAmount yet
    const difference = actualCash - expectedCash;

    // Handle complete
    const handleComplete = async () => {
        setSaving(true);

        const settlement: Settlement = {
            id: `settlement-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            performedBy: 'current-user', // Would come from context
            performedByName: currentUserName,
            openingCash,
            expectedCash,
            actualCash,
            difference,
            totalBills: todayBills.length,
            totalSales,
            totalDiscount,
            totalTax,
            cashSales: paymentBreakdown.cash,
            cardSales: paymentBreakdown.card,
            upiSales: paymentBreakdown.upi,
            creditSales: paymentBreakdown.credit,
            notes: notes || undefined,
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to IndexedDB (would be in a proper storage service)
        try {
            await onComplete(settlement);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Calculator size={20} />
                            End of Day Settlement
                        </h2>
                        <p className="text-emerald-100 text-sm">
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Loading today's data...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                        <FileText size={16} />
                                        <span className="text-xs font-medium">Total Bills</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {todayBills.length}
                                    </p>
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                        <IndianRupee size={16} />
                                        <span className="text-xs font-medium">Total Sales</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                        {formatCurrency(totalSales)}
                                    </p>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                                        <Clock size={16} />
                                        <span className="text-xs font-medium">Discounts</span>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                        {formatCurrency(totalDiscount)}
                                    </p>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                                        <FileText size={16} />
                                        <span className="text-xs font-medium">Tax Collected</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                        {formatCurrency(totalTax)}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                    Payment Method Breakdown
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="flex items-center gap-2">
                                        <IndianRupee size={18} className="text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Cash</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(paymentBreakdown.cash)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={18} className="text-blue-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Card</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(paymentBreakdown.card)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Smartphone size={18} className="text-purple-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">UPI</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(paymentBreakdown.upi)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText size={18} className="text-orange-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Credit</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(paymentBreakdown.credit)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cash Reconciliation */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Cash Drawer Reconciliation
                                </h3>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {/* Opening Cash */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Opening Cash
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={openingCash}
                                                onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 
                                                         rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Expected Cash */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Expected Cash
                                        </label>
                                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg 
                                                      text-gray-900 dark:text-gray-100 font-medium">
                                            {formatCurrency(openingCash + expectedCash)}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Opening + Cash Sales
                                        </p>
                                    </div>

                                    {/* Actual Cash */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Actual Cash in Drawer
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={actualCash}
                                                onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 
                                                         rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Difference */}
                                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${difference === 0
                                    ? 'bg-green-50 dark:bg-green-900/20'
                                    : difference > 0
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                    {difference === 0 ? (
                                        <CheckCircle className="text-green-500" size={24} />
                                    ) : (
                                        <AlertCircle className={difference > 0 ? 'text-blue-500' : 'text-red-500'} size={24} />
                                    )}
                                    <div>
                                        <p className={`font-medium ${difference === 0
                                            ? 'text-green-700 dark:text-green-300'
                                            : difference > 0
                                                ? 'text-blue-700 dark:text-blue-300'
                                                : 'text-red-700 dark:text-red-300'
                                            }`}>
                                            {difference === 0
                                                ? 'Cash drawer is balanced!'
                                                : difference > 0
                                                    ? `Cash surplus: ${formatCurrency(difference)}`
                                                    : `Cash shortage: ${formatCurrency(Math.abs(difference))}`
                                            }
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Difference between actual and expected cash
                                        </p>
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
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             resize-none"
                                    placeholder="Any comments or observations about today's settlement..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 
                                         text-gray-700 dark:text-gray-300 rounded-lg font-medium 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 
                                         text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 
                                         disabled:opacity-60 disabled:cursor-not-allowed transition-all
                                         flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        Complete Settlement
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
