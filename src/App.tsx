// Western Pharmacy - Medicine Inventory Management App
// Main application component with Inventory & Billing views

import { useState, useCallback, useEffect } from 'react';
import { useMedicines } from './hooks/useMedicines';
import { useBilling } from './hooks/useBilling';
import { Medicine, SortField, MedicineLocation, StockStatus } from './types/medicine';
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
import { Plus, Pill, Package, Receipt } from 'lucide-react';

type ViewMode = 'inventory' | 'billing';

function App() {
    const {
        medicines,
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

    // Modal states
    const [medicineModal, setMedicineModal] = useState<{ open: boolean; medicine: Medicine | null }>({
        open: false,
        medicine: null
    });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; medicine: Medicine | null; bulk: boolean }>({
        open: false,
        medicine: null,
        bulk: false
    });
    const [locationModal, setLocationModal] = useState<Medicine | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Keyboard shortcut: 'B' to toggle billing
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                return;
            }

            if (e.key.toLowerCase() === 'b') {
                setViewMode(prev => prev === 'billing' ? 'inventory' : 'billing');
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky-header">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-medical-blue rounded-xl">
                                <Pill className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Western Pharmacy</h1>
                                <p className="text-sm text-gray-500">Medicine Inventory</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('inventory')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                        ${viewMode === 'inventory'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    <Package size={16} />
                                    <span className="hidden sm:inline">Inventory</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('billing')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                        ${viewMode === 'billing'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`}
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
                        medicines={medicines}
                        cart={billing.cart}
                        discountPercent={billing.discountPercent}
                        subtotal={billing.subtotal}
                        discountAmount={billing.discountAmount}
                        grandTotal={billing.grandTotal}
                        bills={billing.bills}
                        error={billing.error}
                        loading={billing.loading}
                        onAddToCart={billing.addToCart}
                        onRemoveFromCart={billing.removeFromCart}
                        onUpdateQuantity={billing.updateCartQuantity}
                        onClearCart={billing.clearCart}
                        onSetDiscount={billing.setDiscount}
                        onConfirmBill={billing.confirmBill}
                        onLoadBills={billing.loadBills}
                        onExportBills={billing.exportBills}
                        onClearError={billing.clearError}
                        onBillComplete={handleBillComplete}
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
        </div>
    );
}

export default App;
