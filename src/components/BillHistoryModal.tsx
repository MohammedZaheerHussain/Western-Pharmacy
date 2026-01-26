/**
 * BillHistoryModal - View past bills with edit and export options
 */

import { useEffect } from 'react';
import { Bill } from '../types/medicine';
import { X, Download, Eye, Receipt, Calendar, Edit2 } from 'lucide-react';

interface BillHistoryModalProps {
    bills: Bill[];
    onClose: () => void;
    onExport: () => void;
    onViewBill: (bill: Bill) => void;
    onEditBill: (bill: Bill) => void;
}

export function BillHistoryModal({ bills, onClose, onExport, onViewBill, onEditBill }: BillHistoryModalProps) {
    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    /** Format date in Indian style */
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /** Format currency */
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
        >
            <div className="modal-content bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] 
                          overflow-hidden flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="history-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Receipt size={22} className="text-medical-blue" />
                        Bill History
                    </h2>
                    <div className="flex items-center gap-2">
                        {bills.length > 0 && (
                            <button
                                onClick={onExport}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 
                                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Export bills to CSV"
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                                     hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Bills List */}
                <div className="flex-1 overflow-y-auto">
                    {bills.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Receipt size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">No bills yet</p>
                            <p className="text-sm">Bills will appear here after you confirm a sale</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {bills.map(bill => (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{bill.billNumber}</span>
                                            {bill.discountPercent > 0 && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 
                                                               text-green-700 dark:text-green-400 rounded-full">
                                                    {bill.discountPercent}% off
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(bill.createdAt)}
                                            </span>
                                            <span>{bill.items.length} item{bill.items.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(bill.grandTotal)}</p>
                                            {bill.discountAmount > 0 && (
                                                <p className="text-xs text-green-600 dark:text-green-400">-{formatCurrency(bill.discountAmount)}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => onEditBill(bill)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-amber-600 
                                                         hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg 
                                                         transition-colors font-medium"
                                                title="Edit bill quantities"
                                                aria-label={`Edit bill ${bill.billNumber}`}
                                            >
                                                <Edit2 size={14} />
                                                <span className="hidden sm:inline">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => onViewBill(bill)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-medical-blue 
                                                         hover:bg-medical-blue/10 rounded-lg transition-colors font-medium"
                                                title="View receipt"
                                                aria-label={`View receipt for ${bill.billNumber}`}
                                            >
                                                <Eye size={14} />
                                                <span className="hidden sm:inline">View</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''} total
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
