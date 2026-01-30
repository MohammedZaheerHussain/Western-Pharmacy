/**
 * Reports Hook - Fetch and calculate sales/inventory reports
 * Provides data for Basic and Advanced reports dashboard
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllBills, getAllMedicines } from '../services/storage';
import { Bill, Medicine } from '../types/medicine';

export interface SalesSummary {
    totalSales: number;
    billCount: number;
    averageBillValue: number;
    totalDiscount: number;
    topMedicines: { name: string; quantity: number; revenue: number }[];
}

export interface ExpiryAlert {
    medicine: Medicine;
    daysUntilExpiry: number;
    status: 'critical' | 'warning' | 'caution';
}

export interface StockSummary {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
}

export type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

/** Get start of day */
function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Get date range boundaries */
function getDateBoundaries(range: DateRange, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (range) {
        case 'today':
            return { start: startOfDay(now), end };

        case 'week': {
            const start = startOfDay(now);
            start.setDate(start.getDate() - 7);
            return { start, end };
        }

        case 'month': {
            const start = startOfDay(now);
            start.setMonth(start.getMonth() - 1);
            return { start, end };
        }

        case 'year': {
            const start = startOfDay(now);
            start.setFullYear(start.getFullYear() - 1);
            return { start, end };
        }

        case 'custom':
            return {
                start: customStart ? startOfDay(customStart) : startOfDay(now),
                end: customEnd ? new Date(customEnd.setHours(23, 59, 59, 999)) : end
            };

        default:
            return { start: startOfDay(now), end };
    }
}

/** Calculate days until expiry */
function getDaysUntilExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Main Reports Hook
 */
export function useReports(dateRange: DateRange = 'today', customStart?: Date, customEnd?: Date) {
    const [bills, setBills] = useState<Bill[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [billsData, medsData] = await Promise.all([
                getAllBills(),
                getAllMedicines()
            ]);
            setBills(billsData);
            setMedicines(medsData);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Date boundaries
    const { start, end } = useMemo(
        () => getDateBoundaries(dateRange, customStart, customEnd),
        [dateRange, customStart, customEnd]
    );

    // Filter bills by date range
    const filteredBills = useMemo(() => {
        return bills.filter(bill => {
            const billDate = new Date(bill.createdAt);
            return billDate >= start && billDate <= end;
        });
    }, [bills, start, end]);

    // Sales Summary
    const salesSummary = useMemo((): SalesSummary => {
        const totalSales = filteredBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
        const totalDiscount = filteredBills.reduce((sum, bill) => sum + bill.discountAmount, 0);
        const billCount = filteredBills.length;
        const averageBillValue = billCount > 0 ? totalSales / billCount : 0;

        // Calculate top medicines
        const medicineMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        filteredBills.forEach(bill => {
            bill.items.forEach(item => {
                const existing = medicineMap.get(item.medicineName) || { name: item.medicineName, quantity: 0, revenue: 0 };
                medicineMap.set(item.medicineName, {
                    name: item.medicineName,
                    quantity: existing.quantity + item.quantity,
                    revenue: existing.revenue + item.total
                });
            });
        });

        const topMedicines = Array.from(medicineMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return {
            totalSales,
            billCount,
            averageBillValue,
            totalDiscount,
            topMedicines
        };
    }, [filteredBills]);

    // Recent Bills (last 10)
    const recentBills = useMemo(() => {
        return [...bills]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
    }, [bills]);

    // Expiry Alerts
    const expiryAlerts = useMemo((): ExpiryAlert[] => {
        const alerts: ExpiryAlert[] = [];

        medicines.forEach(medicine => {
            const days = getDaysUntilExpiry(medicine.expiryDate);

            if (days <= 90 && medicine.quantity > 0) {
                let status: ExpiryAlert['status'] = 'caution';
                if (days <= 30) status = 'critical';
                else if (days <= 60) status = 'warning';

                alerts.push({
                    medicine,
                    daysUntilExpiry: days,
                    status
                });
            }
        });

        return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }, [medicines]);

    // Stock Summary
    const stockSummary = useMemo((): StockSummary => {
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let expiringCount = 0;

        medicines.forEach(med => {
            // unitPrice is per strip, quantity is in tablets, so divide by tabletsPerStrip
            totalValue += (med.quantity * med.unitPrice) / (med.tabletsPerStrip || 1);

            if (med.quantity === 0) {
                outOfStockCount++;
            } else if (med.quantity < 10) {
                lowStockCount++;
            }

            const days = getDaysUntilExpiry(med.expiryDate);
            if (days <= 90 && days > 0 && med.quantity > 0) {
                expiringCount++;
            }
        });

        return {
            totalItems: medicines.length,
            totalValue,
            lowStockCount,
            outOfStockCount,
            expiringCount
        };
    }, [medicines]);

    // Daily sales for chart (last 7 days)
    const dailySales = useMemo(() => {
        const days: { date: string; sales: number; bills: number }[] = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayBills = bills.filter(bill => bill.createdAt.startsWith(dateStr));
            const daySales = dayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);

            days.push({
                date: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
                sales: daySales,
                bills: dayBills.length
            });
        }

        return days;
    }, [bills]);

    return {
        loading,
        error,
        salesSummary,
        recentBills,
        expiryAlerts,
        stockSummary,
        dailySales,
        filteredBills,
        medicines,
        refresh: fetchData
    };
}
