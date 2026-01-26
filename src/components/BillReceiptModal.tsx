// BillReceiptModal - Printable receipt view for a completed bill

import { useEffect, useRef } from 'react';
import { Bill } from '../types/medicine';
import { X, Printer } from 'lucide-react';

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
        const content = receiptRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill ${bill.billNumber}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { font-size: 20px; margin: 0; }
                    .header p { font-size: 12px; color: #666; margin: 5px 0; }
                    .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { padding: 8px 4px; text-align: left; }
                    th { border-bottom: 1px solid #333; }
                    .right { text-align: right; }
                    .total-row { font-weight: bold; font-size: 14px; }
                    .summary { margin-top: 15px; }
                    .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
                    .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                ${content.innerHTML}
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-content bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] 
                          overflow-hidden flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Bill Receipt</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-gray-600 hover:text-medical-blue hover:bg-gray-100 
                                     rounded-lg transition-colors"
                            title="Print"
                        >
                            <Printer size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                                     rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div ref={receiptRef}>
                        {/* Receipt Header */}
                        <div className="header text-center mb-6">
                            <h1 className="text-xl font-bold text-gray-900">Western Pharmacy</h1>
                            <p className="text-sm text-gray-500">Medicine Inventory</p>
                            <div className="divider border-t border-dashed border-gray-300 my-4" />
                            <p className="text-sm font-medium">{bill.billNumber}</p>
                            <p className="text-sm text-gray-500">{formatDate(bill.createdAt)}</p>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="py-2 text-left font-medium text-gray-600">Item</th>
                                    <th className="py-2 text-center font-medium text-gray-600">Qty</th>
                                    <th className="py-2 text-right font-medium text-gray-600">Price</th>
                                    <th className="py-2 text-right font-medium text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bill.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2">
                                            <p className="font-medium text-gray-900">{item.medicineName}</p>
                                            <p className="text-xs text-gray-500">{item.brand}</p>
                                        </td>
                                        <td className="py-2 text-center">{item.quantity}</td>
                                        <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Summary */}
                        <div className="summary border-t border-gray-200 pt-4 space-y-2">
                            <div className="summary-row flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>{formatCurrency(bill.subtotal)}</span>
                            </div>
                            {bill.discountPercent > 0 && (
                                <div className="summary-row flex justify-between text-green-600">
                                    <span>Discount ({bill.discountPercent}%)</span>
                                    <span>-{formatCurrency(bill.discountAmount)}</span>
                                </div>
                            )}
                            <div className="grand-total flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-3 mt-3">
                                <span>Grand Total</span>
                                <span className="text-medical-blue">{formatCurrency(bill.grandTotal)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="footer text-center mt-8 text-sm text-gray-500">
                            <p>Thank you for your purchase!</p>
                            <p className="mt-1">Western Pharmacy</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
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
                        className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium
                                 hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
