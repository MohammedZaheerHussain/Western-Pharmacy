// BillHistoryModal - View past bills with export functionality

import { useEffect } from 'react';
import { Bill } from '../types/medicine';
import { X, Download, Eye, Receipt, Calendar } from 'lucide-react';

interface BillHistoryModalProps {
    bills: Bill[];
    onClose: () => void;
    onExport: () => void;
    onViewBill: (bill: Bill) => void;
}

export function BillHistoryModal({ bills, onClose, onExport, onViewBill }: BillHistoryModalProps) {
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
        >
            <div className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] 
                          overflow-hidden flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Receipt size={22} className="text-medical-blue" />
                        Bill History
                    </h2>
                    <div className="flex items-center gap-2">
                        {bills.length > 0 && (
                            <button
                                onClick={onExport}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 
                                         hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                                     rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Bills List */}
                <div className="flex-1 overflow-y-auto">
                    {bills.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Receipt size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-lg font-medium">No bills yet</p>
                            <p className="text-sm">Bills will appear here after you confirm a sale</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {bills.map(bill => (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-900">{bill.billNumber}</span>
                                            {bill.discountPercent > 0 && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                    {bill.discountPercent}% off
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(bill.createdAt)}
                                            </span>
                                            <span>{bill.items.length} item{bill.items.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(bill.grandTotal)}</p>
                                            {bill.discountAmount > 0 && (
                                                <p className="text-xs text-green-600">-{formatCurrency(bill.discountAmount)}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onViewBill(bill)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-medical-blue 
                                                     hover:bg-medical-blue/10 rounded-lg transition-colors font-medium"
                                        >
                                            <Eye size={16} />
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-500">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''} total
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium
                                 hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
