// useBilling hook - State management for billing/cart operations
// Supports: new bills, editing existing bills, low-stock warnings

import { useState, useCallback, useMemo } from 'react';
import { Medicine, CartItem, Bill, BillItem } from '../types/medicine';
import { createBill, updateBill } from '../services/guardedOperations';
import { getAllBills, exportBillsToCSV } from '../services/storage';
import { useRole } from '../context/RoleContext';
import { Customer, pointsToRupees, calculatePointsEarned } from '../types/customer';
import { awardPoints, redeemPoints } from '../services/customerStorage';
import { getCurrentBranchId } from '../services/branchStorage';

/** Low stock threshold - matches inventory alerts */
export const LOW_STOCK_THRESHOLD = 10;

/** Batch price info for FEFO pricing */
interface BatchPriceInfo {
    batchId: string;
    batchNumber: string;
    quantity: number; // Available qty in this batch
    unitPrice: number; // Price per strip for this batch
}

/**
 * Calculate FEFO-based total cost from stored batch prices
 * This is used when updating quantities to ensure correct per-batch pricing
 */
function calculateFEFOTotal(
    tablets: number,
    tabletsPerStrip: number,
    batchPrices: BatchPriceInfo[] | undefined,
    fallbackPricePerStrip: number
): number {
    if (!batchPrices || batchPrices.length === 0) {
        // No batch prices stored, use fallback
        const strips = tablets / tabletsPerStrip;
        return strips * fallbackPricePerStrip;
    }

    let remainingTablets = tablets;
    let totalCost = 0;

    for (const batch of batchPrices) {
        if (remainingTablets <= 0) break;

        const tabletsFromBatch = Math.min(remainingTablets, batch.quantity);
        const stripsFromBatch = tabletsFromBatch / tabletsPerStrip;
        totalCost += stripsFromBatch * batch.unitPrice;
        remainingTablets -= tabletsFromBatch;
    }

    // If we need more tablets than available in batches, use fallback for remainder
    if (remainingTablets > 0) {
        const remainingStrips = remainingTablets / tabletsPerStrip;
        totalCost += remainingStrips * fallbackPricePerStrip;
    }

    return totalCost;
}

/** Extended cart item with edit tracking and batch pricing */
interface EditableCartItem extends CartItem {
    originalQuantity?: number; // For edit mode: track original qty for delta
    batchPrices?: BatchPriceInfo[]; // FEFO-sorted batch prices for accurate pricing
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

    // Customer loyalty
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
    pointsToRedeem: number;
    setPointsToRedeem: (points: number) => void;
    pointsDiscount: number;

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

    // Customer loyalty state
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    // Activity logging from role context
    const { logActivity } = useRole();

    // Derived state
    const isEditMode = editingBill !== null;

    // Calculate totals
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
    const discountAmount = useMemo(() => (subtotal * discountPercent) / 100, [subtotal, discountPercent]);
    const pointsDiscount = useMemo(() => pointsToRupees(pointsToRedeem), [pointsToRedeem]);
    const grandTotal = useMemo(() => Math.max(0, subtotal - discountAmount - pointsDiscount), [subtotal, discountAmount, pointsDiscount]);

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
        const getFEFOPrice = (tablets: number): { unitPrice: number; batchBreakdown: string; totalCost: number } => {
            if (sortedBatches.length === 0) {
                const price = medicine.unitPrice || 0;
                const strips = tablets / tabletsPerStrip;
                return { unitPrice: price, batchBreakdown: '', totalCost: strips * price };
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
                batchBreakdown: allocations.length > 1 ? allocations.join(', ') : '',
                totalCost
            };
        };

        // Create batch price info for storage
        const batchPrices: BatchPriceInfo[] = sortedBatches.map(b => ({
            batchId: b.id,
            batchNumber: b.batchNumber,
            quantity: b.quantity,
            unitPrice: b.unitPrice || medicine.unitPrice || 0
        }));

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

                // Get FEFO-based cost for the new quantity
                const { unitPrice, totalCost } = getFEFOPrice(newTotalTablets);

                // Recalculate strip/loose breakdown
                const newStripQty = Math.floor(newTotalTablets / tabletsPerStrip);
                const newLooseQty = newTotalTablets % tabletsPerStrip;

                const updated = [...prev];
                updated[existingIndex] = {
                    ...existing,
                    quantity: newTotalTablets,
                    unitPrice,
                    stripQty: newStripQty,
                    looseQty: newLooseQty,
                    total: totalCost, // Use actual batch-calculated total
                    batchPrices // Update batch prices
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

            // Get FEFO-based pricing
            const { unitPrice, totalCost } = getFEFOPrice(quantity);

            // Calculate initial strip/loose breakdown
            const stripQty = Math.floor(quantity / tabletsPerStrip);
            const looseQty = quantity % tabletsPerStrip;

            const newItem: EditableCartItem = {
                medicineId: medicine.id,
                medicineName: medicine.name,
                brand: medicine.brand,
                quantity, // Total tablets
                unitPrice,
                tabletsPerStrip,
                stripQty,
                looseQty,
                total: totalCost, // Use actual batch-calculated total
                availableStock: medicine.quantity,
                batchPrices // Store for future recalculations
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

            // Calculate FEFO-based total from stored batch prices
            const total = calculateFEFOTotal(
                quantity,
                tabletsPerStrip,
                item.batchPrices,
                item.unitPrice
            );

            updated[itemIndex] = {
                ...item,
                quantity,
                stripQty,
                looseQty,
                total
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

            // Calculate FEFO-based total from stored batch prices
            const total = calculateFEFOTotal(
                totalTablets,
                tabletsPerStrip,
                item.batchPrices,
                item.unitPrice
            );

            const updated = [...prev];
            updated[itemIndex] = {
                ...item,
                quantity: totalTablets,
                stripQty,
                looseQty: validLoose,
                total
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
        setSelectedCustomer(null);
        setPointsToRedeem(0);
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
                logActivity('bill_edit', 'bill', bill.id, `Updated bill ${bill.billNumber}`);
            } else {
                // Create new bill
                bill = await createBill(billItems.filter(i => i.quantity > 0), discountPercent, customerName, customerPhone, doctorName);
                setSuccessMessage(`Bill ${bill.billNumber} created! Total: ₹${bill.grandTotal.toFixed(2)}`);
                logActivity('bill_create', 'bill', bill.id, `Created bill ${bill.billNumber} for ₹${bill.grandTotal.toFixed(2)}`);

                // Loyalty: Award points to customer
                if (selectedCustomer && grandTotal > 0) {
                    const branchId = getCurrentBranchId() || undefined;
                    const pointsEarned = calculatePointsEarned(grandTotal);

                    // Redeem points if any
                    if (pointsToRedeem > 0) {
                        await redeemPoints(selectedCustomer.id, bill.id, pointsToRedeem, branchId);
                    }

                    // Award new points
                    if (pointsEarned > 0) {
                        await awardPoints(selectedCustomer.id, bill.id, grandTotal, branchId);
                    }
                }
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
    }, [cart, discountPercent, customerName, customerPhone, doctorName, isEditMode, editingBill, clearCart, logActivity]);

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
        loading,
        // Customer loyalty
        selectedCustomer,
        setSelectedCustomer,
        pointsToRedeem,
        setPointsToRedeem,
        pointsDiscount
    };
}
