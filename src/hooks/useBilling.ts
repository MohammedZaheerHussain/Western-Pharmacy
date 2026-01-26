// useBilling hook - State management for billing/cart operations

import { useState, useCallback } from 'react';
import { Medicine, CartItem, Bill, BillItem } from '../types/medicine';
import { createBill, getAllBills, exportBillsToCSV } from '../services/storage';

interface UseBillingReturn {
    // Cart state
    cart: CartItem[];
    discountPercent: number;
    subtotal: number;
    discountAmount: number;
    grandTotal: number;

    // Cart actions
    addToCart: (medicine: Medicine, quantity?: number) => void;
    removeFromCart: (medicineId: string) => void;
    updateCartQuantity: (medicineId: string, quantity: number) => void;
    clearCart: () => void;
    setDiscount: (percent: number) => void;

    // Billing actions
    confirmBill: () => Promise<Bill>;

    // Bill history
    bills: Bill[];
    loadBills: () => Promise<void>;
    exportBills: () => void;

    // Error state
    error: string | null;
    clearError: () => void;
    loading: boolean;
}

/**
 * Custom hook for managing billing state and operations
 */
export function useBilling(): UseBillingReturn {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [bills, setBills] = useState<Bill[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const grandTotal = subtotal - discountAmount;

    /**
     * Add medicine to cart - increments quantity if already present
     */
    const addToCart = useCallback((medicine: Medicine, quantity: number = 1) => {
        if (medicine.quantity <= 0) {
            setError(`${medicine.name} is out of stock`);
            return;
        }

        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.medicineId === medicine.id);

            if (existingIndex >= 0) {
                // Increment existing item
                const existing = prev[existingIndex];
                const newQty = existing.quantity + quantity;

                if (newQty > medicine.quantity) {
                    setError(`Cannot add more. Available stock: ${medicine.quantity}`);
                    return prev;
                }

                const updated = [...prev];
                updated[existingIndex] = {
                    ...existing,
                    quantity: newQty,
                    total: newQty * existing.unitPrice
                };
                return updated;
            }

            // Add new item
            if (quantity > medicine.quantity) {
                setError(`Requested quantity exceeds available stock (${medicine.quantity})`);
                return prev;
            }

            const newItem: CartItem = {
                medicineId: medicine.id,
                medicineName: medicine.name,
                brand: medicine.brand,
                quantity,
                unitPrice: medicine.unitPrice || 0,
                total: quantity * (medicine.unitPrice || 0),
                availableStock: medicine.quantity
            };

            return [...prev, newItem];
        });

        setError(null);
    }, []);

    /**
     * Remove item from cart
     */
    const removeFromCart = useCallback((medicineId: string) => {
        setCart(prev => prev.filter(item => item.medicineId !== medicineId));
    }, []);

    /**
     * Update quantity of cart item with validation
     */
    const updateCartQuantity = useCallback((medicineId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(medicineId);
            return;
        }

        setCart(prev => {
            const itemIndex = prev.findIndex(item => item.medicineId === medicineId);
            if (itemIndex < 0) return prev;

            const item = prev[itemIndex];

            if (quantity > item.availableStock) {
                setError(`Maximum available: ${item.availableStock}`);
                return prev;
            }

            const updated = [...prev];
            updated[itemIndex] = {
                ...item,
                quantity,
                total: quantity * item.unitPrice
            };

            setError(null);
            return updated;
        });
    }, [removeFromCart]);

    /**
     * Clear all items from cart
     */
    const clearCart = useCallback(() => {
        setCart([]);
        setDiscountPercent(0);
        setError(null);
    }, []);

    /**
     * Set discount percentage (0-100)
     */
    const setDiscount = useCallback((percent: number) => {
        const validated = Math.max(0, Math.min(100, percent));
        setDiscountPercent(validated);
    }, []);

    /**
     * Confirm and create bill - deducts stock atomically
     */
    const confirmBill = useCallback(async (): Promise<Bill> => {
        if (cart.length === 0) {
            throw new Error('Cart is empty');
        }

        setLoading(true);
        setError(null);

        try {
            // Convert cart items to bill items (without availableStock)
            const billItems: BillItem[] = cart.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                brand: item.brand,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total
            }));

            const bill = await createBill(billItems, discountPercent);

            // Clear cart after successful billing
            clearCart();

            // Refresh bills list
            await loadBills();

            return bill;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create bill';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cart, discountPercent, clearCart]);

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

    return {
        cart,
        discountPercent,
        subtotal,
        discountAmount,
        grandTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        setDiscount,
        confirmBill,
        bills,
        loadBills,
        exportBills,
        error,
        clearError,
        loading
    };
}
