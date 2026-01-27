/**
 * BillReceiptModal - Printable receipt view for a completed bill
 * Imports print.css for professional thermal printer output
 */

import { useEffect, useRef } from 'react';
import { Bill } from '../types/medicine';
import { X, Printer } from 'lucide-react';
import '../styles/print.css';

interface BillReceiptModalProps {
    bill: Bill;
    onClose: () => void;
}

export function BillReceiptModal({ bill, onClose }: BillReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

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

    /** Handle print */
    const handlePrint = () => {
        window.print();
    };

    return (
        <div
            className="modal-backdrop no-print"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
        >
            <div className="modal-content bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] 
                          overflow-hidden flex flex-col mx-4">
                {/* Header - Hidden in print */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 no-print">
                    <h2 id="receipt-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bill Receipt</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-medical-blue hover:bg-gray-100 
                                     dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Print"
                            aria-label="Print receipt"
                        >
                            <Printer size={20} />
                        </button>
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

                {/* Receipt Content - This is what prints */}
                <div className="flex-1 overflow-y-auto p-6 print-container">
                    <div ref={receiptRef}>
                        {/* Receipt Header */}
                        <div className="receipt-header text-center mb-6">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">WESTORN PHARMACY</h1>
                            <p className="pharmacy-address text-sm text-gray-500 dark:text-gray-400">Udumalaippettai, Tamil Nadu</p>
                            <p className="pharmacy-address text-sm text-gray-500 dark:text-gray-400">Phone: ____________</p>
                            <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-4" />
                            <div className="text-left mb-2">
                                <p className="bill-number text-lg font-bold text-gray-900 dark:text-gray-100">{bill.billNumber}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(bill.createdAt)}</p>
                                {(bill.customerName || bill.customerPhone) && (
                                    <div className="mt-2 pt-2 border-t border-dotted border-gray-300 dark:border-gray-600">
                                        {bill.customerName && (
                                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                                <span className="text-gray-500 dark:text-gray-400">Customer:</span> {bill.customerName}
                                            </p>
                                        )}
                                        {bill.customerPhone && (
                                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                                <span className="text-gray-500 dark:text-gray-400">Phone:</span> {bill.customerPhone}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="receipt-table w-full text-sm mb-4">
                            <thead>
                                <tr className="border-b border-gray-300 dark:border-gray-600">
                                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Item</th>
                                    <th className="py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Price</th>
                                    <th className="py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {bill.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2 item-name">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.medicineName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.brand}</p>
                                        </td>
                                        <td className="py-2 text-center item-qty text-gray-900 dark:text-gray-100">{item.quantity}</td>
                                        <td className="py-2 text-right item-price text-gray-600 dark:text-gray-400">{formatCurrency(item.unitPrice)}</td>
                                        <td className="py-2 text-right item-total font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Summary */}
                        <div className="receipt-summary border-t-2 border-gray-300 dark:border-gray-600 pt-4 space-y-2">
                            <div className="summary-row flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span className="text-gray-900 dark:text-gray-100">{formatCurrency(bill.subtotal)}</span>
                            </div>
                            {bill.discountPercent > 0 && (
                                <div className="summary-row discount flex justify-between text-green-600 dark:text-green-400">
                                    <span>Discount ({bill.discountPercent}%)</span>
                                    <span>-{formatCurrency(bill.discountAmount)}</span>
                                </div>
                            )}
                            <div className="summary-row grand-total flex justify-between text-xl font-bold border-t-2 border-gray-400 dark:border-gray-500 pt-3 mt-3">
                                <span className="text-gray-900 dark:text-gray-100">Grand Total</span>
                                <span className="text-medical-blue">{formatCurrency(bill.grandTotal)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="receipt-footer text-center mt-8 pt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
                            <p className="thank-you font-semibold text-gray-900 dark:text-gray-100">Thank you for your purchase!</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weston Pharmacy</p>
                            <p className="powered-by text-xs text-gray-400 dark:text-gray-500 mt-4">Powered by Weston Pharmacy App</p>
                        </div>
                    </div>
                </div>

                {/* Actions - Hidden in print */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-2.5 bg-medical-blue text-white rounded-lg font-medium
                                 hover:bg-medical-blue-dark transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
