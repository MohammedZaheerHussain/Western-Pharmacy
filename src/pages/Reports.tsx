/**
 * Reports Page - Sales Summary, Expiry Alerts, Stock Overview
 * Available to ALL plans (Basic, Pro, Premium)
 */

import { useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    Package,
    AlertTriangle,
    RefreshCw,
    IndianRupee,
    FileText,
    Clock,
    ShoppingCart
} from 'lucide-react';
import { useReports, DateRange, ExpiryAlert } from '../hooks/useReports';
import { PharmacySettings } from '../components/SettingsModal';

interface ReportsProps {
    settings: PharmacySettings;
    formatCurrency: (amount: number) => string;
}

export function Reports({ settings, formatCurrency }: ReportsProps) {
    const [dateRange, setDateRange] = useState<DateRange>('today');
    const {
        loading,
        salesSummary,
        recentBills,
        expiryAlerts,
        stockSummary,
        dailySales,
        refresh
    } = useReports(dateRange);

    const criticalAlerts = expiryAlerts.filter(a => a.status === 'critical');

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Reports & Analytics
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {settings.shop.name || 'Your Pharmacy'} - Business Overview
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                        {(['today', 'week', 'month'] as DateRange[]).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === range
                                    ? 'bg-medical-blue text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="p-2 text-gray-500 hover:text-medical-blue hover:bg-gray-100 
                                 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Sales */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100 text-sm">Total Sales</span>
                        <IndianRupee size={20} className="text-green-200" />
                    </div>
                    <p className="text-2xl font-bold">
                        {formatCurrency(salesSummary.totalSales)}
                    </p>
                    <p className="text-green-200 text-xs mt-1">
                        {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
                    </p>
                </div>

                {/* Bill Count */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm">Bills Created</span>
                        <FileText size={20} className="text-blue-200" />
                    </div>
                    <p className="text-2xl font-bold">
                        {salesSummary.billCount}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">
                        Avg: {formatCurrency(salesSummary.averageBillValue)}
                    </p>
                </div>

                {/* Stock Value */}
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm">Stock Value</span>
                        <Package size={20} className="text-purple-200" />
                    </div>
                    <p className="text-2xl font-bold">
                        {formatCurrency(stockSummary.totalValue)}
                    </p>
                    <p className="text-purple-200 text-xs mt-1">
                        {stockSummary.totalItems} items
                    </p>
                </div>

                {/* Alerts */}
                <div className={`rounded-xl p-4 text-white ${criticalAlerts.length > 0
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm">Expiry Alerts</span>
                        <AlertTriangle size={20} className="text-white/70" />
                    </div>
                    <p className="text-2xl font-bold">
                        {expiryAlerts.length}
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                        {criticalAlerts.length} critical (≤30 days)
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Bills */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Clock size={18} />
                            Recent Bills
                        </h2>
                        <span className="text-xs text-gray-500">Last 10</span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentBills.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <ShoppingCart className="mx-auto mb-2 opacity-50" size={32} />
                                <p>No bills yet</p>
                            </div>
                        ) : (
                            recentBills.map(bill => (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {bill.billNumber}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {bill.customerName || 'Walk-in'} • {bill.items.length} items
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(bill.grandTotal)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(bill.createdAt).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Selling */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <TrendingUp size={18} />
                            Top Selling
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {salesSummary.topMedicines.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <BarChart3 className="mx-auto mb-2 opacity-50" size={32} />
                                <p>No sales data</p>
                            </div>
                        ) : (
                            salesSummary.topMedicines.slice(0, 5).map((med, idx) => (
                                <div
                                    key={med.name}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        idx === 1 ? 'bg-gray-100 text-gray-600' :
                                            idx === 2 ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-50 text-gray-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {med.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {med.quantity} units sold
                                        </p>
                                    </div>
                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                        {formatCurrency(med.revenue)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Daily Sales Chart (Simple Bar) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} />
                    7-Day Sales Trend
                </h2>

                <div className="flex items-end justify-between h-40 gap-2">
                    {dailySales.map((day, idx) => {
                        const maxSales = Math.max(...dailySales.map(d => d.sales), 1);
                        const height = (day.sales / maxSales) * 100;

                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {day.sales > 0 ? formatCurrency(day.sales) : '-'}
                                </span>
                                <div
                                    className="w-full bg-gradient-to-t from-medical-blue to-blue-400 rounded-t-md transition-all"
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {day.date}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Expiry Alerts */}
            {expiryAlerts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Expiry Alerts
                        </h2>
                        <span className="text-xs text-gray-500">
                            {expiryAlerts.length} items expiring within 90 days
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                        {expiryAlerts.slice(0, 20).map(alert => (
                            <ExpiryAlertRow
                                key={alert.medicine.id}
                                alert={alert}
                                formatCurrency={formatCurrency}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Stock Alerts */}
            {(stockSummary.lowStockCount > 0 || stockSummary.outOfStockCount > 0) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Package className="text-amber-600 dark:text-amber-400" size={24} />
                        <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">
                                Stock Attention Needed
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                {stockSummary.outOfStockCount} out of stock • {stockSummary.lowStockCount} low stock
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Expiry Alert Row Component */
function ExpiryAlertRow({
    alert,
    formatCurrency: _formatCurrency
}: {
    alert: ExpiryAlert;
    formatCurrency: (n: number) => string;
}) {
    const { medicine, daysUntilExpiry, status } = alert;

    const statusColors = {
        critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        caution: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };

    const statusLabels = {
        critical: 'Critical',
        warning: 'Warning',
        caution: 'Caution'
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
                    {statusLabels[status]}
                </span>
                <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                        {medicine.name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {medicine.brand} • Qty: {medicine.quantity}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-medium ${daysUntilExpiry <= 0 ? 'text-red-600' :
                    daysUntilExpiry <= 30 ? 'text-red-500' :
                        daysUntilExpiry <= 60 ? 'text-orange-500' : 'text-yellow-600'
                    }`}>
                    {daysUntilExpiry <= 0 ? 'EXPIRED' : `${daysUntilExpiry} days`}
                </p>
                <p className="text-xs text-gray-500">
                    Exp: {new Date(medicine.expiryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </p>
            </div>
        </div>
    );
}

export default Reports;
