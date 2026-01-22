// MedicineTable component with sortable columns, checkbox selection, and inline actions
// Memoized rows for performance with large datasets

import { memo } from 'react';
import { Medicine, SortConfig, SortField } from '../types/medicine';
import { getStockStatus, formatLocation } from '../hooks/useMedicines';
import { StatusBadge } from './StatusBadge';
import {
    Edit2,
    Trash2,
    MapPin,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown
} from 'lucide-react';

interface MedicineTableProps {
    medicines: Medicine[];
    sort: SortConfig;
    onSort: (field: SortField) => void;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onEdit: (medicine: Medicine) => void;
    onDelete: (medicine: Medicine) => void;
    onLocate: (medicine: Medicine) => void;
    highlightedId?: string | null;
}

// Memoized table row for performance
const MedicineRow = memo(function MedicineRow({
    medicine,
    isSelected,
    isHighlighted,
    onToggleSelect,
    onEdit,
    onDelete,
    onLocate
}: {
    medicine: Medicine;
    isSelected: boolean;
    isHighlighted: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onLocate: () => void;
}) {
    const status = getStockStatus(medicine);
    const locationStr = formatLocation(medicine.location);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <tr
            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors
                  ${isHighlighted ? 'row-highlight bg-yellow-50' : ''}
                  ${isSelected ? 'bg-medical-blue-light' : ''}`}
        >
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-4 h-4 rounded border-gray-300 text-medical-blue 
                     focus:ring-medical-blue cursor-pointer"
                    aria-label={`Select ${medicine.name}`}
                />
            </td>
            <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{medicine.name}</div>
                <div className="text-sm text-gray-500">{medicine.salt}</div>
            </td>
            <td className="px-4 py-3 text-gray-700">{medicine.brand}</td>
            <td className="px-4 py-3">
                <span className={`font-semibold ${medicine.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                    {medicine.quantity}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-sm">{locationStr}</span>
                    <button
                        onClick={onLocate}
                        className="p-1 text-medical-blue hover:bg-medical-blue-light rounded transition-colors"
                        aria-label="Locate medicine"
                        title="Locate"
                    >
                        <MapPin size={16} />
                    </button>
                </div>
            </td>
            <td className="px-4 py-3 text-gray-700">{formatDate(medicine.expiryDate)}</td>
            <td className="px-4 py-3">
                <StatusBadge status={status} />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 text-gray-500 hover:text-medical-blue hover:bg-gray-100 
                       rounded-lg transition-colors"
                        aria-label="Edit medicine"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 
                       rounded-lg transition-colors"
                        aria-label="Delete medicine"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

export function MedicineTable({
    medicines,
    sort,
    onSort,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onLocate,
    highlightedId
}: MedicineTableProps) {
    const allSelected = medicines.length > 0 && medicines.every(m => selectedIds.has(m.id));
    const someSelected = medicines.some(m => selectedIds.has(m.id));

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sort.field !== field) {
            return <ChevronsUpDown size={14} className="text-gray-400" />;
        }
        return sort.direction === 'asc'
            ? <ChevronUp size={14} className="text-medical-blue" />
            : <ChevronDown size={14} className="text-medical-blue" />;
    };

    const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <th
            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer
                 hover:bg-gray-100 transition-colors select-none"
            onClick={() => onSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                <SortIcon field={field} />
            </div>
        </th>
    );

    if (medicines.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">No medicines found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-12">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={onSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-medical-blue 
                             focus:ring-medical-blue cursor-pointer"
                                    aria-label="Select all medicines"
                                />
                            </th>
                            <SortableHeader field="name">Medicine Name</SortableHeader>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Brand</th>
                            <SortableHeader field="quantity">Qty</SortableHeader>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                            <SortableHeader field="expiryDate">Expiry</SortableHeader>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 w-24 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicines.map(medicine => (
                            <MedicineRow
                                key={medicine.id}
                                medicine={medicine}
                                isSelected={selectedIds.has(medicine.id)}
                                isHighlighted={highlightedId === medicine.id}
                                onToggleSelect={() => onToggleSelect(medicine.id)}
                                onEdit={() => onEdit(medicine)}
                                onDelete={() => onDelete(medicine)}
                                onLocate={() => onLocate(medicine)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer with count */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                {selectedIds.size > 0 ? (
                    <span>{selectedIds.size} of {medicines.length} selected</span>
                ) : (
                    <span>Showing {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}</span>
                )}
            </div>
        </div>
    );
}
