/**
 * Westorn Pharmacy - Medicine Inventory Management App
 * Main application with Inventory/Billing views and Dark Mode
 */

import { useState, useCallback, useEffect } from 'react';
import { useMedicines } from './hooks/useMedicines';
import { useBilling } from './hooks/useBilling';
import { Medicine, SortField, MedicineLocation, StockStatus, Bill } from './types/medicine';
import { MedicineFormData } from './components/MedicineModal';
import {
    SearchBar,
    FilterBar,
    AlertBanner,
    MedicineTable,
    MedicineModal,
    DeleteConfirmModal,
    BulkActionsBar,
    ImportExportBar,
    LocationModal,
    BillingPanel
} from './components';
import { InstallButton, InstallSuccessToast } from './components/InstallButton';
import { Plus, Pill, Package, Receipt, Sun, Moon } from 'lucide-react';

type ViewMode = 'inventory' | 'billing';
type Theme = 'light' | 'dark' | 'system';

/** Get initial theme from localStorage or system preference */
function getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
    }
    return 'system';
}

/** Apply theme to document */
function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
    } else {
        root.classList.toggle('dark', theme === 'dark');
    }
}

function App() {
    const {
        medicines,
        allMedicines,
        loading,
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
        refreshMedicines
    } = useMedicines();

    const billing = useBilling();

    // View mode state
    const [viewMode, setViewMode] = useState<ViewMode>('inventory');

    // Theme state
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Modal states
    const [medicineModal, setMedicineModal] = useState<{ open: boolean; medicine: Medicine | null }>({
        open: false,
        medicine: null
    });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; medicine: Medicine | null; bulk: boolean }>({ open: false, medicine: null, bulk: false });
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [locationModal, setLocationModal] = useState<Medicine | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showInstallToast, setShowInstallToast] = useState(false);

    // Apply theme on mount and changes
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                return;
            }

            // 'B' - Toggle billing
            if (e.key.toLowerCase() === 'b') {
                setViewMode(prev => prev === 'billing' ? 'inventory' : 'billing');
            }

            // 'D' - Toggle dark mode
            if (e.key.toLowerCase() === 'd') {
                setTheme(prev => prev === 'dark' ? 'light' : 'dark');
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    /** Toggle theme between light/dark */
    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            if (prev === 'system') {
                const isDark = document.documentElement.classList.contains('dark');
                return isDark ? 'light' : 'dark';
            }
            return prev === 'dark' ? 'light' : 'dark';
        });
    }, []);

    // Handle sort change
    const handleSort = useCallback((field: SortField) => {
        setSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, [setSort]);

    // Handle select all
    const handleSelectAll = useCallback(() => {
        const allIds = medicines.map(m => m.id);
        const allSelected = allIds.every(id => selectedIds.has(id));

        if (allSelected) {
            clearSelection();
        } else {
            selectAll(allIds);
        }
    }, [medicines, selectedIds, selectAll, clearSelection]);

    // Handle add/edit medicine
    const handleSaveMedicine = async (data: MedicineFormData) => {
        if (medicineModal.medicine) {
            await updateMedicine(medicineModal.medicine.id, data);
        } else {
            await addMedicine(data);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            if (deleteModal.bulk) {
                await bulkDelete(Array.from(selectedIds));
            } else if (deleteModal.medicine) {
                await deleteMedicine(deleteModal.medicine.id);
            }
            setDeleteModal({ open: false, medicine: null, bulk: false });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle bulk location update
    const handleBulkLocationUpdate = async (location: MedicineLocation) => {
        await bulkUpdateLocation(Array.from(selectedIds), location);
        clearSelection();
    };

    // Handle locate - highlight row and show location modal
    const handleLocate = useCallback((medicine: Medicine) => {
        setHighlightedId(medicine.id);
        setLocationModal(medicine);

        // Clear highlight after animation
        setTimeout(() => setHighlightedId(null), 2000);
    }, []);

    // Handle alert filter click
    const handleAlertFilter = useCallback((status: StockStatus | 'all') => {
        setFilters(prev => ({
            ...prev,
            stockStatus: prev.stockStatus === status ? 'all' : status
        }));
    }, [setFilters]);

    // Handle bill completion - refresh inventory
    const handleBillComplete = useCallback(() => {
        refreshMedicines();
    }, [refreshMedicines]);

    // Handle edit bill - load into billing
    const handleEditBill = useCallback((bill: Bill) => {
        setViewMode('billing');
        billing.loadBillForEdit(bill, allMedicines);
    }, [billing, allMedicines]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky-header transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-medical-blue rounded-xl">
                                <Pill className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Westorn Pharmacy</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Medicine Inventory</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                                         rounded-lg transition-colors"
                                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (D)`}
                                aria-label="Toggle theme"
                            >
                                {document.documentElement.classList.contains('dark') ? (
                                    <Sun size={20} />
                                ) : (
                                    <Moon size={20} />
                                )}
                            </button>

                            {/* PWA Install Button */}
                            <InstallButton onInstallSuccess={() => setShowInstallToast(true)} />

                            {/* View Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('inventory')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                        ${viewMode === 'inventory'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    <Package size={16} />
                                    <span className="hidden sm:inline">Inventory</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('billing')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                        ${viewMode === 'billing'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    <Receipt size={16} />
                                    <span className="hidden sm:inline">Billing</span>
                                </button>
                            </div>

                            {viewMode === 'inventory' && (
                                <>
                                    <ImportExportBar
                                        onExport={exportCSV}
                                        onImport={importMedicines}
                                        parseCSV={parseCSV}
                                    />
                                    <button
                                        onClick={() => setMedicineModal({ open: true, medicine: null })}
                                        className="flex items-center gap-2 px-4 py-2 bg-medical-blue text-white 
                                   rounded-lg hover:bg-medical-blue-dark transition-colors font-medium"
                                    >
                                        <Plus size={20} />
                                        <span className="hidden sm:inline">Add Medicine</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - only in inventory mode */}
                    {viewMode === 'inventory' && (
                        <SearchBar
                            value={filters.search}
                            onChange={(search) => setFilters(prev => ({ ...prev, search }))}
                        />
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                {viewMode === 'inventory' ? (
                    <>
                        {/* Alerts */}
                        <AlertBanner
                            lowStockCount={alerts.lowStock}
                            expiringCount={alerts.expiringSoon}
                            outOfStockCount={alerts.outOfStock}
                            onFilter={handleAlertFilter}
                            currentFilter={filters.stockStatus}
                        />

                        {/* Filters */}
                        <FilterBar
                            filters={filters}
                            onChange={setFilters}
                        />

                        {/* Medicine Table */}
                        <MedicineTable
                            medicines={medicines}
                            sort={sort}
                            onSort={handleSort}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onSelectAll={handleSelectAll}
                            onEdit={(medicine) => setMedicineModal({ open: true, medicine })}
                            onDelete={(medicine) => setDeleteModal({ open: true, medicine, bulk: false })}
                            onLocate={handleLocate}
                            highlightedId={highlightedId}
                        />

                        {/* Bulk Actions Bar */}
                        <BulkActionsBar
                            selectedCount={selectedIds.size}
                            onDelete={() => setDeleteModal({ open: true, medicine: null, bulk: true })}
                            onUpdateLocation={handleBulkLocationUpdate}
                            onClear={clearSelection}
                        />
                    </>
                ) : (
                    /* Billing View */
                    <BillingPanel
                        medicines={allMedicines}
                        cart={billing.cart}
                        discountPercent={billing.discountPercent}
                        subtotal={billing.subtotal}
                        discountAmount={billing.discountAmount}
                        grandTotal={billing.grandTotal}
                        customerName={billing.customerName}
                        customerPhone={billing.customerPhone}
                        bills={billing.bills}
                        error={billing.error}
                        successMessage={billing.successMessage}
                        loading={billing.loading}
                        editingBill={billing.editingBill}
                        isEditMode={billing.isEditMode}
                        onAddToCart={billing.addToCart}
                        onRemoveFromCart={billing.removeFromCart}
                        onUpdateQuantity={billing.updateCartQuantity}
                        onUpdateStripLooseQty={billing.updateStripLooseQty}
                        onClearCart={billing.clearCart}
                        onSetDiscount={billing.setDiscount}
                        onSetCustomerName={billing.setCustomerName}
                        onSetCustomerPhone={billing.setCustomerPhone}
                        onConfirmBill={billing.confirmBill}
                        onLoadBills={billing.loadBills}
                        onExportBills={billing.exportBills}
                        onClearError={billing.clearError}
                        onClearSuccess={billing.clearSuccess}
                        onBillComplete={handleBillComplete}
                        onEditBill={handleEditBill}
                        onCancelEdit={billing.cancelEdit}
                    />
                )}
            </main>

            {/* Modals */}
            <MedicineModal
                isOpen={medicineModal.open}
                medicine={medicineModal.medicine}
                onClose={() => setMedicineModal({ open: false, medicine: null })}
                onSave={handleSaveMedicine}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.open}
                title={deleteModal.bulk ? 'Delete Selected Medicines' : 'Delete Medicine'}
                message={
                    deleteModal.bulk
                        ? `Are you sure you want to delete ${selectedIds.size} selected medicines?`
                        : `Are you sure you want to delete "${deleteModal.medicine?.name}"?`
                }
                itemCount={deleteModal.bulk ? selectedIds.size : undefined}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ open: false, medicine: null, bulk: false })}
                loading={actionLoading}
            />

            <LocationModal
                medicine={locationModal}
                onClose={() => setLocationModal(null)}
            />

            {/* PWA Install Success Toast */}
            <InstallSuccessToast
                show={showInstallToast}
                onClose={() => setShowInstallToast(false)}
            />
        </div>
    );
}

export default App;
