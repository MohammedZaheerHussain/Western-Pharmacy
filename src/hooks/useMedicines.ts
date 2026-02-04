// Custom React hook for medicines state management
// Handles filtering, sorting, and all medicine operations

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Medicine,
    FilterConfig,
    SortConfig,
    StockStatus,
    MedicineLocation
} from '../types/medicine';
import * as storage from '../services/storage';
import * as guardedOps from '../services/guardedOperations';
import { useRole } from '../context/RoleContext';

// Helper to determine stock status
export function getStockStatus(medicine: Medicine): StockStatus {
    if (medicine.quantity === 0) return 'out';

    const expiryDate = new Date(medicine.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Check if expired first
    if (expiryDate < today) return 'expired';

    // Check if expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiryDate <= thirtyDaysFromNow) return 'expiring';

    // Check low stock after expiry checks
    if (medicine.quantity < 10 && medicine.stockAlertEnabled !== false) return 'low';

    return 'ok';
}

// Format location for display
export function formatLocation(location: MedicineLocation): string {
    const parts = [`Rack ${location.rack}`, `Shelf ${location.shelf}`];
    if (location.drawer) parts.push(`Drawer ${location.drawer}`);
    return parts.join(' → ');
}

export function useMedicines() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<FilterConfig>({
        search: '',
        category: 'all',
        stockStatus: 'all'
    });

    const [sort, setSort] = useState<SortConfig>({
        field: 'name',
        direction: 'asc'
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Activity logging from role context
    const { logActivity } = useRole();

    // Load medicines on mount
    useEffect(() => {
        async function loadMedicines() {
            try {
                setLoading(true);
                await storage.seedInitialData();
                const data = await storage.getAllMedicines();
                setMedicines(data);
                setError(null);
            } catch (err) {
                setError('Failed to load medicines');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadMedicines();
    }, []);

    // Refresh medicines from storage
    const refresh = useCallback(async () => {
        try {
            const data = await storage.getAllMedicines();
            setMedicines(data);
            setSelectedIds(new Set());
        } catch (err) {
            setError('Failed to refresh medicines');
            console.error(err);
        }
    }, []);

    // Add medicine
    const addMedicine = useCallback(async (
        medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>
    ) => {
        try {
            await guardedOps.addMedicine(medicine);
            await refresh();
            logActivity('create', 'medicine', undefined, `Added medicine: ${medicine.name}`);
        } catch (err) {
            setError('Failed to add medicine');
            console.error(err);
            throw err;
        }
    }, [refresh, logActivity]);

    // Update medicine
    const updateMedicine = useCallback(async (
        id: string,
        updates: Partial<Omit<Medicine, 'id' | 'createdAt' | 'auditHistory'>>
    ) => {
        try {
            await guardedOps.updateMedicine(id, updates);
            await refresh();
            logActivity('update', 'medicine', id, `Updated medicine`);
        } catch (err) {
            setError('Failed to update medicine');
            console.error(err);
            throw err;
        }
    }, [refresh, logActivity]);

    // Delete medicine
    const deleteMedicine = useCallback(async (id: string) => {
        try {
            await guardedOps.deleteMedicine(id);
            await refresh();
            logActivity('delete', 'medicine', id, `Deleted medicine`);
        } catch (err) {
            setError('Failed to delete medicine');
            console.error(err);
            throw err;
        }
    }, [refresh, logActivity]);

    // Bulk delete
    const bulkDelete = useCallback(async (ids: string[]) => {
        try {
            await guardedOps.bulkDeleteMedicines(ids);
            await refresh();
            logActivity('delete', 'medicine', undefined, `Bulk deleted ${ids.length} medicines`);
        } catch (err) {
            setError('Failed to delete medicines');
            console.error(err);
            throw err;
        }
    }, [refresh, logActivity]);

    // Bulk update location
    const bulkUpdateLocation = useCallback(async (ids: string[], location: MedicineLocation) => {
        try {
            await guardedOps.bulkUpdateLocation(ids, location);
            await refresh();
            logActivity('update', 'medicine', undefined, `Updated location for ${ids.length} medicines`);
        } catch (err) {
            setError('Failed to update locations');
            console.error(err);
            throw err;
        }
    }, [refresh, logActivity]);

    // Import medicines
    const importMedicines = useCallback(async (
        newMedicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[]
    ) => {
        try {
            await guardedOps.importMedicines(newMedicines);
            await refresh();
        } catch (err) {
            setError('Failed to import medicines');
            console.error(err);
            throw err;
        }
    }, [refresh]);

    // Export to CSV
    const exportCSV = useCallback(() => {
        const csv = storage.exportToCSV(medicines);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [medicines]);

    // Parse CSV for import preview
    const parseCSV = useCallback((content: string) => {
        return storage.parseCSV(content);
    }, []);

    // Selection helpers
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Filtered and sorted medicines
    const filteredMedicines = useMemo(() => {
        let result = [...medicines];

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(searchLower) ||
                m.brand.toLowerCase().includes(searchLower) ||
                m.salt.toLowerCase().includes(searchLower) ||
                m.location.rack.toLowerCase().includes(searchLower) ||
                m.location.shelf.toLowerCase().includes(searchLower) ||
                (m.location.drawer?.toLowerCase().includes(searchLower))
            );
        }

        // Apply category filter
        if (filters.category !== 'all') {
            result = result.filter(m => m.category === filters.category);
        }

        // Apply stock status filter
        if (filters.stockStatus !== 'all') {
            result = result.filter(m => getStockStatus(m) === filters.stockStatus);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;

            switch (sort.field) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'quantity':
                    comparison = a.quantity - b.quantity;
                    break;
                case 'expiryDate':
                    comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                    break;
            }

            return sort.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [medicines, filters, sort]);

    // Alert counts
    const alerts = useMemo(() => {
        const lowStock = medicines.filter(m => m.quantity > 0 && m.quantity < 10).length;
        const outOfStock = medicines.filter(m => m.quantity === 0).length;
        const expiringSoon = medicines.filter(m => {
            const expiryDate = new Date(m.expiryDate);
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return expiryDate <= thirtyDaysFromNow && expiryDate > today;
        }).length;

        return { lowStock, outOfStock, expiringSoon };
    }, [medicines]);

    return {
        medicines: filteredMedicines,
        allMedicines: medicines,
        loading,
        error,
        filters,
        setFilters,
        sort,
        setSort,
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        alerts,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        bulkDelete,
        bulkUpdateLocation,
        importMedicines,
        exportCSV,
        parseCSV,
        refreshMedicines: refresh
    };
}
