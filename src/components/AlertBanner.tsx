// AlertBanner component showing low stock and expiring medicine alerts
// Clicking an alert filters the table to show corresponding medicines

import { AlertTriangle, Clock } from 'lucide-react';
import { StockStatus } from '../types/medicine';

interface AlertBannerProps {
    lowStockCount: number;
    expiringCount: number;
    outOfStockCount: number;
    onFilter: (status: StockStatus | 'all') => void;
    currentFilter: StockStatus | 'all';
}

export function AlertBanner({
    lowStockCount,
    expiringCount,
    outOfStockCount,
    onFilter,
    currentFilter
}: AlertBannerProps) {
    const hasAlerts = lowStockCount > 0 || expiringCount > 0 || outOfStockCount > 0;

    if (!hasAlerts) return null;

    return (
        <div className="flex flex-wrap gap-3">
            {outOfStockCount > 0 && (
                <button
                    onClick={() => onFilter(currentFilter === 'out' ? 'all' : 'out')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     transition-all ${currentFilter === 'out'
                            ? 'bg-gray-700 text-white ring-2 ring-gray-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <AlertTriangle size={16} />
                    <span>{outOfStockCount} out of stock</span>
                </button>
            )}

            {lowStockCount > 0 && (
                <button
                    onClick={() => onFilter(currentFilter === 'low' ? 'all' : 'low')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     transition-all ${currentFilter === 'low'
                            ? 'bg-red-600 text-white ring-2 ring-red-400'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                >
                    <AlertTriangle size={16} />
                    <span>{lowStockCount} low in stock</span>
                </button>
            )}

            {expiringCount > 0 && (
                <button
                    onClick={() => onFilter(currentFilter === 'expiring' ? 'all' : 'expiring')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     transition-all ${currentFilter === 'expiring'
                            ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                >
                    <Clock size={16} />
                    <span>{expiringCount} expiring soon</span>
                </button>
            )}
        </div>
    );
}
