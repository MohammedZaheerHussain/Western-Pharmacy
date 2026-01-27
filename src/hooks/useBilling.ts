// useBilling hook - State management for billing/cart operations
// Supports: new bills, editing existing bills, low-stock warnings

import { useState, useCallback, useMemo } from 'react';
import { Medicine, CartItem, Bill, BillItem } from '../types/medicine';
import { createBill, updateBill, getAllBills, exportBillsToCSV } from '../services/storage';

/** Low stock threshold - matches inventory alerts */
export const LOW_STOCK_THRESHOLD = 10;

/** Extended cart item with edit tracking */
interface EditableCartItem extends CartItem {
    originalQuantity?: number; // For edit mode: track original qty for delta
}

interface UseBillingReturn {
    // Cart state
    cart: EditableCartItem[];
    discountPercent: number;
    subtotal: number;
    discountAmount: number;
    grandTotal: number;

    // Customer info (optional)
    customerName: string;
    customerPhone: string;
    doctorName: string;
    setCustomerName: (name: string) => void;
    setCustomerPhone: (phone: string) => void;
    setDoctorName: (name: string) => void;

    // Edit mode state
    editingBill: Bill | null;
    isEditMode: boolean;

    // Cart actions
    addToCart: (medicine: Medicine, quantity?: number) => void;
    removeFromCart: (medicineId: string) => void;
    updateCartQuantity: (medicineId: string, quantity: number) => void;
    updateStripLooseQty: (medicineId: string, stripQty: number, looseQty: number) => void;
    clearCart: () => void;
    setDiscount: (percent: number) => void;

    // Billing actions
    confirmBill: () => Promise<Bill>;
    loadBillForEdit: (bill: Bill, medicines: Medicine[]) => void;
    cancelEdit: () => void;

    // Low stock helpers
    getPostSaleStock: (medicineId: string, currentStock: number) => number;
    isLowStockAfterSale: (medicineId: string, currentStock: number) => boolean;

    // Bill history
    bills: Bill[];
    loadBills: () => Promise<void>;
    exportBills: () => void;

    // Error/success state
    error: string | null;
    successMessage: string | null;
    clearError: () => void;
    clearSuccess: () => void;
    loading: boolean;
}

/**
 * Custom hook for managing billing state and operations
 * Supports creating new bills and editing existing ones
 */
export function useBilling(): UseBillingReturn {
    const [cart, setCart] = useState<EditableCartItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [bills, setBills] = useState<Bill[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);

    // Derived state
    const isEditMode = editingBill !== null;

    // Calculate totals
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
    const discountAmount = useMemo(() => (subtotal * discountPercent) / 100, [subtotal, discountPercent]);
    const grandTotal = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

    /**
     * Get post-sale stock for a medicine after current cart sale
     */
    const getPostSaleStock = useCallback((medicineId: string, currentStock: number): number => {
        const cartItem = cart.find(item => item.medicineId === medicineId);
        if (!cartItem) return currentStock;

        // In edit mode, account for original quantity already deducted
        const originalQty = cartItem.originalQuantity || 0;
        const netChange = cartItem.quantity - originalQty;
        return currentStock - netChange;
    }, [cart]);

    /**
     * Check if medicine will be low stock after this sale
     */
    const isLowStockAfterSale = useCallback((medicineId: string, currentStock: number): boolean => {
        const postSaleStock = getPostSaleStock(medicineId, currentStock);
        return postSaleStock > 0 && postSaleStock < LOW_STOCK_THRESHOLD;
    }, [getPostSaleStock]);

    /**
     * Add medicine to cart - uses FEFO (First Expiry First Out) for batch pricing
     */
    const addToCart = useCallback((medicine: Medicine, quantity: number = 1) => {
        if (medicine.quantity <= 0) {
            setError(`${medicine.name} is out of stock`);
            return;
        }

        const tabletsPerStrip = medicine.tabletsPerStrip || 1;

        // FEFO: Sort batches by expiry date to get earliest expiry first
        const sortedBatches = [...(medicine.batches || [])]
            .filter(b => b.quantity > 0)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        // Get weighted average price based on FEFO batch allocation
        const getFEFOPrice = (tablets: number): { unitPrice: number; batchBreakdown: string } => {
            if (sortedBatches.length === 0) {
                return { unitPrice: medicine.unitPrice || 0, batchBreakdown: '' };
            }

            let remainingTablets = tablets;
            let totalCost = 0;
            const allocations: string[] = [];

            for (const batch of sortedBatches) {
                if (remainingTablets <= 0) break;

                const batchPrice = batch.unitPrice || medicine.unitPrice || 0;
                const tabletsFromBatch = Math.min(remainingTablets, batch.quantity);
                const stripsFromBatch = tabletsFromBatch / tabletsPerStrip;

                totalCost += stripsFromBatch * batchPrice;
                remainingTablets -= tabletsFromBatch;

                if (tabletsFromBatch > 0 && sortedBatches.length > 1) {
                    allocations.push(`${batch.batchNumber}: ₹${batchPrice}`);
                }
            }

            const effectiveStripPrice = tablets > 0 ? (totalCost / (tablets / tabletsPerStrip)) : 0;
            return {
                unitPrice: effectiveStripPrice,
                batchBreakdown: allocations.length > 1 ? allocations.join(', ') : ''
            };
        };

        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.medicineId === medicine.id);

            if (existingIndex >= 0) {
                // Increment existing item by tablets
                const existing = prev[existingIndex];
                const newTotalTablets = existing.quantity + quantity;

                // Calculate effective available (in edit mode, add back original qty)
                const effectiveAvailable = isEditMode
                    ? medicine.quantity + (existing.originalQuantity || 0)
                    : medicine.quantity;

                if (newTotalTablets > effectiveAvailable) {
                    setError(`Cannot add more. Available: ${effectiveAvailable} tablets`);
                    return prev;
                }

                // Get FEFO-based price for the new quantity
                const { unitPrice } = getFEFOPrice(newTotalTablets);

                // Recalculate strip/loose breakdown
                const newStripQty = Math.floor(newTotalTablets / tabletsPerStrip);
                const newLooseQty = newTotalTablets % tabletsPerStrip;
                const stripTotal = newStripQty * unitPrice;
                const looseTotal = tabletsPerStrip > 1 ? newLooseQty * (unitPrice / tabletsPerStrip) : 0;

                const updated = [...prev];
                updated[existingIndex] = {
                    ...existing,
                    quantity: newTotalTablets,
                    unitPrice,
                    stripQty: newStripQty,
                    looseQty: newLooseQty,
                    total: stripTotal + looseTotal
                };

                // Low stock warning
                const postSale = effectiveAvailable - newTotalTablets;
                if (postSale > 0 && postSale < LOW_STOCK_THRESHOLD) {
                    setError(`Warning: Only ${postSale} tablets will remain after sale`);
                } else {
                    setError(null);
                }

                return updated;
            }

            // Add new item - allowed in both new bill and edit mode
            if (quantity > medicine.quantity) {
                setError(`Requested quantity exceeds available stock (${medicine.quantity} tablets)`);
                return prev;
            }

            // Get FEFO-based price
            const { unitPrice } = getFEFOPrice(quantity);

            // Calculate initial strip/loose breakdown
            const stripQty = Math.floor(quantity / tabletsPerStrip);
            const looseQty = quantity % tabletsPerStrip;
            const stripTotal = stripQty * unitPrice;
            const looseTotal = tabletsPerStrip > 1 ? looseQty * (unitPrice / tabletsPerStrip) : 0;

            const newItem: EditableCartItem = {
                medicineId: medicine.id,
                medicineName: medicine.name,
                brand: medicine.brand,
                quantity, // Total tablets
                unitPrice,
                tabletsPerStrip,
                stripQty,
                looseQty,
                total: stripTotal + looseTotal,
                availableStock: medicine.quantity
            };

            // Low stock warning
            const postSale = medicine.quantity - quantity;
            if (postSale > 0 && postSale < LOW_STOCK_THRESHOLD) {
                setError(`Warning: Only ${postSale} tablets will remain after sale`);
            } else {
                setError(null);
            }

            return [...prev, newItem];
        });
    }, [isEditMode]);

    /**
     * Remove item from cart (in edit mode, this sets qty to 0 for restock)
     */
    const removeFromCart = useCallback((medicineId: string) => {
        if (isEditMode) {
            // In edit mode, set quantity to 0 to trigger restock on save
            setCart(prev => prev.map(item =>
                item.medicineId === medicineId
                    ? { ...item, quantity: 0, stripQty: 0, looseQty: 0, total: 0 }
                    : item
            ));
        } else {
            setCart(prev => prev.filter(item => item.medicineId !== medicineId));
        }
    }, [isEditMode]);

    /**
     * Update quantity of cart item with validation
     */
    const updateCartQuantity = useCallback((medicineId: string, quantity: number) => {
        // In edit mode, allow qty=0 (item removal)
        if (quantity < 0) return;

        if (!isEditMode && quantity < 1) {
            removeFromCart(medicineId);
            return;
        }

        setCart(prev => {
            const itemIndex = prev.findIndex(item => item.medicineId === medicineId);
            if (itemIndex < 0) return prev;

            const item = prev[itemIndex];

            // Calculate effective available stock
            const effectiveAvailable = isEditMode
                ? item.availableStock + (item.originalQuantity || 0)
                : item.availableStock;

            if (quantity > effectiveAvailable) {
                setError(`Maximum available: ${effectiveAvailable}`);
                return prev;
            }

            const updated = [...prev];
            // Recalculate strip/loose breakdown based on new total
            const tabletsPerStrip = item.tabletsPerStrip || 1;
            const stripQty = Math.floor(quantity / tabletsPerStrip);
            const looseQty = quantity % tabletsPerStrip;
            const stripTotal = stripQty * item.unitPrice;
            const looseTotal = tabletsPerStrip > 1 ? looseQty * (item.unitPrice / tabletsPerStrip) : 0;

            updated[itemIndex] = {
                ...item,
                quantity,
                stripQty,
                looseQty,
                total: stripTotal + looseTotal
            };

            // Low stock warning
            const postSale = effectiveAvailable - quantity;
            if (postSale > 0 && postSale < LOW_STOCK_THRESHOLD) {
                setError(`Warning: Only ${postSale} tablets will remain`);
            } else {
                setError(null);
            }

            return updated;
        });
    }, [isEditMode, removeFromCart]);

    /**
     * Update cart item with strip and loose tablet quantities
     * This is the primary handler for the two-field billing input
     */
    const updateStripLooseQty = useCallback((medicineId: string, stripQty: number, looseQty: number) => {
        if (stripQty < 0 || looseQty < 0) return;

        setCart(prev => {
            const itemIndex = prev.findIndex(item => item.medicineId === medicineId);
            if (itemIndex < 0) return prev;

            const item = prev[itemIndex];
            const tabletsPerStrip = item.tabletsPerStrip || 1;

            // Ensure loose doesn't exceed max
            const validLoose = Math.min(looseQty, tabletsPerStrip - 1);
            const totalTablets = (stripQty * tabletsPerStrip) + validLoose;

            // In edit mode, allow qty=0
            if (!isEditMode && totalTablets < 1) {
                removeFromCart(medicineId);
                return prev;
            }

            // Calculate effective available stock
            const effectiveAvailable = isEditMode
                ? item.availableStock + (item.originalQuantity || 0)
                : item.availableStock;

            if (totalTablets > effectiveAvailable) {
                setError(`Maximum available: ${effectiveAvailable} tablets`);
                return prev;
            }

            // Calculate price
            const stripTotal = stripQty * item.unitPrice;
            const looseTotal = tabletsPerStrip > 1 ? validLoose * (item.unitPrice / tabletsPerStrip) : 0;

            const updated = [...prev];
            updated[itemIndex] = {
                ...item,
                quantity: totalTablets,
                stripQty,
                looseQty: validLoose,
                total: stripTotal + looseTotal
            };

            // Low stock warning
            const postSale = effectiveAvailable - totalTablets;
            if (postSale > 0 && postSale < LOW_STOCK_THRESHOLD) {
                setError(`Warning: Only ${postSale} tablets will remain`);
            } else {
                setError(null);
            }

            return updated;
        });
    }, [isEditMode, removeFromCart]);

    /**
     * Clear all items from cart and reset edit mode
     */
    const clearCart = useCallback(() => {
        setCart([]);
        setDiscountPercent(0);
        setCustomerName('');
        setCustomerPhone('');
        setDoctorName('');
        setError(null);
        setEditingBill(null);
    }, []);

    /**
     * Cancel edit mode and restore cart
     */
    const cancelEdit = useCallback(() => {
        setCart([]);
        setDiscountPercent(0);
        setCustomerName('');
        setCustomerPhone('');
        setDoctorName('');
        setError(null);
        setEditingBill(null);
    }, []);

    /**
     * Set discount percentage (0-100)
     */
    const setDiscount = useCallback((percent: number) => {
        const validated = Math.max(0, Math.min(100, percent));
        setDiscountPercent(validated);
    }, []);

    /**
     * Load an existing bill for editing
     */
    const loadBillForEdit = useCallback((bill: Bill, medicines: Medicine[]) => {
        // Convert bill items to cart items with original quantities
        const cartItems: EditableCartItem[] = bill.items.map(item => {
            const medicine = medicines.find(m => m.id === item.medicineId);
            const tabletsPerStrip = item.tabletsPerStrip || medicine?.tabletsPerStrip || 1;

            return {
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                brand: item.brand,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                tabletsPerStrip,
                stripQty: item.stripQty || Math.floor(item.quantity / tabletsPerStrip),
                looseQty: item.looseQty || (item.quantity % tabletsPerStrip),
                total: item.total,
                availableStock: medicine?.quantity || 0,
                originalQuantity: item.quantity // Track for delta calculation
            };
        });

        setCart(cartItems);
        setDiscountPercent(bill.discountPercent);
        setCustomerName(bill.customerName || '');
        setCustomerPhone(bill.customerPhone || '');
        setEditingBill(bill);
        setError(null);
    }, []);

    /**
     * Confirm and create/update bill - handles stock atomically
     */
    const confirmBill = useCallback(async (): Promise<Bill> => {
        // Filter out qty=0 items for new bills
        const activeItems = cart.filter(item => item.quantity > 0);

        if (activeItems.length === 0 && !isEditMode) {
            throw new Error('Cart is empty');
        }

        setLoading(true);
        setError(null);

        try {
            // Convert cart items to bill items
            const billItems: BillItem[] = cart.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                brand: item.brand,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                tabletsPerStrip: item.tabletsPerStrip || 1,
                stripQty: item.stripQty || 0,
                looseQty: item.looseQty || 0,
                total: item.total
            }));

            let bill: Bill;

            if (isEditMode && editingBill) {
                // Update existing bill with delta calculations
                const originalItems = editingBill.items;
                bill = await updateBill(editingBill.id, billItems, discountPercent, originalItems, customerName, customerPhone, doctorName);
                setSuccessMessage(`Bill ${bill.billNumber} updated successfully!`);
            } else {
                // Create new bill
                bill = await createBill(billItems.filter(i => i.quantity > 0), discountPercent, customerName, customerPhone, doctorName);
                setSuccessMessage(`Bill ${bill.billNumber} created! Total: ₹${bill.grandTotal.toFixed(2)}`);
            }

            // Clear cart after successful billing
            clearCart();

            // Refresh bills list
            await loadBills();

            // Auto-clear success after 4 seconds
            setTimeout(() => setSuccessMessage(null), 4000);

            return bill;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to process bill';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cart, discountPercent, customerName, customerPhone, doctorName, isEditMode, editingBill, clearCart]);

    /**
     * Load bill history from storage
     */
    const loadBills = useCallback(async () => {
        try {
            const allBills = await getAllBills();
            setBills(allBills);
        } catch (err) {
            console.error('Failed to load bills:', err);
        }
    }, []);

    /**
     * Export bills to CSV and trigger download
     */
    const exportBills = useCallback(() => {
        if (bills.length === 0) {
            setError('No bills to export');
            return;
        }

        const csv = exportBillsToCSV(bills);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `bills_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [bills]);

    /**
     * Clear error message
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Clear success message
     */
    const clearSuccess = useCallback(() => {
        setSuccessMessage(null);
    }, []);

    return {
        cart,
        discountPercent,
        subtotal,
        discountAmount,
        grandTotal,
        customerName,
        customerPhone,
        doctorName,
        setCustomerName,
        setCustomerPhone,
        setDoctorName,
        editingBill,
        isEditMode,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateStripLooseQty,
        clearCart,
        setDiscount,
        confirmBill,
        loadBillForEdit,
        cancelEdit,
        getPostSaleStock,
        isLowStockAfterSale,
        bills,
        loadBills,
        exportBills,
        error,
        successMessage,
        clearError,
        clearSuccess,
        loading
    };
}
