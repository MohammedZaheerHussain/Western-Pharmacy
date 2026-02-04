// StatusBadge component showing stock status
// OK = green, Low Stock = red, Expiring Soon = orange, Out of Stock = gray

import { StockStatus } from '../types/medicine';

interface StatusBadgeProps {
    status: StockStatus;
}

const STATUS_CONFIG: Record<StockStatus, { label: string; className: string }> = {
    ok: {
        label: 'OK',
        className: 'bg-green-100 text-green-700 border-green-200'
    },
    low: {
        label: 'Low Stock',
        className: 'bg-red-100 text-red-700 border-red-200'
    },
    expiring: {
        label: 'Expiring Soon',
        className: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    expired: {
        label: 'Expired',
        className: 'bg-rose-200 text-rose-800 border-rose-300'
    },
    out: {
        label: 'Out of Stock',
        className: 'bg-gray-100 text-gray-700 border-gray-200'
    }
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}
        >
            {config.label}
        </span>
    );
}
