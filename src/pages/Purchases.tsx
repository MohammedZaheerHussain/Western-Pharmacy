/**
 * Purchases Page - Purchase Order Management
 * Pro/Premium feature
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Calendar,
    Package,
    FileText,
    AlertCircle,
    Truck,
    IndianRupee
} from 'lucide-react';
import {
    getAllPurchases,
    getAllSuppliers,
    getPurchaseSummary
} from '../services/supplierStorage';
import { PurchaseOrder, Supplier, PurchaseSummary } from '../types/purchase';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';

interface PurchasesProps {
    formatCurrency: (amount: number) => string;
    onNavigateToSuppliers: () => void;
}

export function Purchases({ formatCurrency, onNavigateToSuppliers }: PurchasesProps) {
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [summary, setSummary] = useState<PurchaseSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    // Load data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [purchaseData, supplierData, summaryData] = await Promise.all([
                getAllPurchases(),
                getAllSuppliers(),
                getPurchaseSummary()
            ]);
            setPurchases(purchaseData);
            setSuppliers(supplierData);
            setSummary(summaryData);
        } catch (e) {
            console.error('Failed to load purchases:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter purchases
    const filteredPurchases = purchases.filter(p => {
        const matchesSearch = p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
            p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
            (p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = filterStatus === 'all' || p.status === filterStatus ||
            (filterStatus === 'unpaid' && p.paymentStatus !== 'paid');

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: PurchaseOrder['status']) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
            confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentBadge = (status: PurchaseOrder['paymentStatus']) => {
        const styles = {
            pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Purchases
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage purchase orders and stock-in
                    </p>
                </div>

                <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-medical-blue text-white
                             rounded-lg hover:bg-medical-blue-dark transition-colors font-medium"
                >
                    <Plus size={18} />
                    New Purchase
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchases</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(summary.totalPurchases)}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Package className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</p>
                                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                    {formatCurrency(summary.pendingPayments)}
                                </p>
                            </div>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <IndianRupee className="text-orange-600 dark:text-orange-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(summary.thisMonthPurchases)}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Suppliers</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {summary.suppliersCount}
                                </p>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Truck className="text-green-600 dark:text-green-400" size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by PO number, supplier, or invoice..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="received">Received</option>
                    <option value="unpaid">Unpaid</option>
                </select>
            </div>

            {/* Purchases List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading purchases...</div>
            ) : filteredPurchases.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                        {search || filterStatus !== 'all' ? 'No purchases found' : 'No purchase orders yet'}
                    </p>
                    {suppliers.length === 0 ? (
                        <button
                            onClick={onNavigateToSuppliers}
                            className="text-medical-blue hover:underline"
                        >
                            Add suppliers first
                        </button>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Create a new purchase order to stock your inventory
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        PO Number
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Supplier
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Payment
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredPurchases.map(purchase => (
                                    <tr
                                        key={purchase.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-gray-400" />
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {purchase.poNumber}
                                                </span>
                                            </div>
                                            {purchase.invoiceNumber && (
                                                <p className="text-xs text-gray-500 ml-6">
                                                    Inv: {purchase.invoiceNumber}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                            {purchase.supplierName}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                                            {new Date(purchase.receivedDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(purchase.grandTotal)}
                                            </p>
                                            {purchase.balanceAmount > 0 && (
                                                <p className="text-xs text-red-500">
                                                    Due: {formatCurrency(purchase.balanceAmount)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(purchase.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getPaymentBadge(purchase.paymentStatus)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Tips */}
            {purchases.length === 0 && suppliers.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                Getting Started with Purchases
                            </p>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                                <li>• Create a purchase order when you receive goods from suppliers</li>
                                <li>• Stock will be automatically added to inventory upon receiving</li>
                                <li>• Track payment status and outstanding balances</li>
                                <li>• Purchase price helps calculate profit margins</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Order Modal */}
            <PurchaseOrderModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                onSuccess={loadData}
            />
        </div>
    );
}

export default Purchases;
