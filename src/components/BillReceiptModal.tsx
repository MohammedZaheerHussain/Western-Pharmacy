/**
 * BillReceiptModal - Printable receipt view for a completed bill
 * Uses shop settings from Settings for header details
 * Imports print.css for professional thermal printer output
 */

import { useEffect, useRef } from 'react';
import { Bill } from '../types/medicine';
import { X, Printer } from 'lucide-react';
import { loadSettings, ShopDetails } from './SettingsModal';
import '../styles/print.css';

interface BillReceiptModalProps {
    bill: Bill;
    onClose: () => void;
}

export function BillReceiptModal({ bill, onClose }: BillReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const settings = loadSettings();
    const shop: ShopDetails = settings.shop;

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
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    /** Format time */
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
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

    /** Format short currency (no symbol) */
    const formatAmount = (amount: number) => {
        return amount.toFixed(2);
    };

    /** Handle print */
    const handlePrint = () => {
        window.print();
    };

    /** Build address string */
    const getFullAddress = () => {
        const parts = [
            shop.address1,
            shop.address2,
            [shop.city, shop.state, shop.pincode].filter(Boolean).join(', ')
        ].filter(Boolean);
        return parts.join(', ');
    };

    /** Get phone numbers string */
    const getPhoneNumbers = () => {
        return [shop.phone1, shop.phone2].filter(Boolean).join(' / ');
    };

    return (
        <div
            className="modal-backdrop no-print"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
        >
            <div className="modal-content bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] 
                          overflow-hidden flex flex-col mx-4">
                {/* Header - Hidden in print */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 no-print">
                    <h2 id="receipt-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice / Receipt</h2>
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
                <div className="flex-1 overflow-y-auto p-4 print-container bg-white">
                    <div ref={receiptRef} className="text-gray-900 text-sm">
                        {/* Shop Header */}
                        {settings.printer.showLogo && (
                            <div className="receipt-header text-center border-b-2 border-gray-800 pb-3 mb-3">
                                <h1 className="text-lg font-bold uppercase tracking-wide">{shop.name || 'PHARMACY'}</h1>
                                {getFullAddress() && (
                                    <p className="text-xs mt-1">{getFullAddress()}</p>
                                )}
                                {getPhoneNumbers() && (
                                    <p className="text-xs">Ph: {getPhoneNumbers()}</p>
                                )}
                                {shop.email && (
                                    <p className="text-xs">{shop.email}</p>
                                )}
                            </div>
                        )}

                        {/* License Numbers Row */}
                        {(shop.gstNumber || shop.dlNumber1 || shop.dlNumber2) && (
                            <div className="grid grid-cols-2 gap-2 text-xs border-b border-gray-300 pb-2 mb-2">
                                {shop.gstNumber && (
                                    <div>
                                        <span className="font-semibold">GST NO:</span> {shop.gstNumber}
                                    </div>
                                )}
                                {(shop.dlNumber1 || shop.dlNumber2) && (
                                    <div className="text-right">
                                        <span className="font-semibold">DL.NO:</span> {shop.dlNumber1}
                                        {shop.dlNumber2 && <><br />{shop.dlNumber2}</>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Invoice Title */}
                        <div className="text-center font-bold text-sm border-b border-gray-300 pb-2 mb-3">
                            {shop.heroText || 'INVOICE / RECEIPT'}
                        </div>

                        {/* Bill Details Row */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div>
                                {bill.customerName && (
                                    <p><span className="font-semibold">Patient Name:</span> {bill.customerName}</p>
                                )}
                                {bill.customerPhone && (
                                    <p><span className="font-semibold">Phone:</span> {bill.customerPhone}</p>
                                )}
                                {bill.doctorName && (
                                    <p><span className="font-semibold">Dr. Name:</span> {bill.doctorName}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p><span className="font-semibold">Bill Date:</span> {formatDate(bill.createdAt)}</p>
                                <p><span className="font-semibold">Bill No:</span> {bill.billNumber}</p>
                                <p><span className="font-semibold">Time:</span> {formatTime(bill.createdAt)}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="receipt-table w-full text-xs border-collapse mb-3">
                            <thead>
                                <tr className="border-y border-gray-800 bg-gray-100">
                                    <th className="py-1 px-1 text-left font-bold">Sr.</th>
                                    <th className="py-1 px-1 text-left font-bold">Medicine Name</th>
                                    <th className="py-1 px-1 text-center font-bold">Qty</th>
                                    <th className="py-1 px-1 text-right font-bold">MRP</th>
                                    <th className="py-1 px-1 text-right font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-200">
                                        <td className="py-1 px-1">{idx + 1}</td>
                                        <td className="py-1 px-1">
                                            <span className="font-medium">{item.medicineName}</span>
                                            {item.brand && (
                                                <span className="text-gray-500 text-[10px] block">{item.brand}</span>
                                            )}
                                        </td>
                                        <td className="py-1 px-1 text-center">{item.quantity}</td>
                                        <td className="py-1 px-1 text-right">{formatAmount(item.unitPrice)}</td>
                                        <td className="py-1 px-1 text-right font-medium">{formatAmount(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Summary */}
                        <div className="receipt-summary border-t-2 border-gray-800 pt-2 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
                            </div>
                            {bill.discountPercent > 0 && (
                                <div className="flex justify-between text-green-700">
                                    <span>Discount ({bill.discountPercent}%):</span>
                                    <span>-{formatCurrency(bill.discountAmount)}</span>
                                </div>
                            )}
                            {settings.gstEnabled && (
                                <div className="flex justify-between">
                                    <span>GST ({settings.gstPercentage}%):</span>
                                    <span>+{formatCurrency((bill.subtotal - bill.discountAmount) * settings.gstPercentage / 100)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold border-t border-gray-400 pt-2 mt-2">
                                <span>Net Amount:</span>
                                <span>
                                    {formatCurrency(
                                        settings.gstEnabled
                                            ? bill.grandTotal + (bill.subtotal - bill.discountAmount) * settings.gstPercentage / 100
                                            : bill.grandTotal
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-400 text-xs">
                            <div className="flex justify-between">
                                <span>Payment Mode:</span>
                                <span className="font-medium">Cash</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="receipt-footer text-center mt-6 pt-3 border-t border-dashed border-gray-400">
                            {shop.tagline && (
                                <p className="font-semibold text-sm italic">{shop.tagline}</p>
                            )}
                            <p className="text-[10px] text-gray-500 mt-2">
                                {shop.name || 'Pharmacy'}
                            </p>
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <p className="text-[9px] text-gray-400">
                                    {shop.footerText || 'Powered by Billova Medical Billing'}
                                </p>
                            </div>
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
