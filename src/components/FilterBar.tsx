// FilterBar component with category and stock status filters
// Filters work in combination with search and update instantly

import { FilterConfig, MEDICINE_CATEGORIES, MedicineCategory, StockStatus } from '../types/medicine';
import { Filter } from 'lucide-react';

interface FilterBarProps {
    filters: FilterConfig;
    onChange: (filters: FilterConfig) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
    return (
        <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-gray-500">
                <Filter size={18} />
                <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Category Filter */}
            <select
                value={filters.category}
                onChange={(e) => onChange({ ...filters, category: e.target.value as MedicineCategory | 'all' })}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white
                   focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20
                   cursor-pointer transition-all"
                aria-label="Filter by category"
            >
                <option value="all">All Categories</option>
                {MEDICINE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>

            {/* Stock Status Filter */}
            <select
                value={filters.stockStatus}
                onChange={(e) => onChange({ ...filters, stockStatus: e.target.value as StockStatus | 'all' })}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white
                   focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20
                   cursor-pointer transition-all"
                aria-label="Filter by stock status"
            >
                <option value="all">All Stock Status</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock (&lt;10)</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="out">Out of Stock</option>
            </select>

            {/* Clear Filters */}
            {(filters.category !== 'all' || filters.stockStatus !== 'all') && (
                <button
                    onClick={() => onChange({ ...filters, category: 'all', stockStatus: 'all' })}
                    className="px-3 py-2 text-sm text-medical-blue hover:text-medical-blue-dark
                     hover:bg-medical-blue-light rounded-lg transition-colors"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}
