/**
 * Supplier Storage Service
 * Manages suppliers and purchase orders in IndexedDB
 * For Pro and Premium plans
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Supplier, PurchaseOrder, PurchasePayment, SupplierFormData } from '../types/purchase';

// Database schema for purchases
interface PurchaseDB extends DBSchema {
    suppliers: {
        key: string;
        value: Supplier;
        indexes: {
            'by-name': string;
            'by-gstin': string;
        };
    };
    purchases: {
        key: string;
        value: PurchaseOrder;
        indexes: {
            'by-supplier': string;
            'by-date': string;
            'by-status': string;
        };
    };
    payments: {
        key: string;
        value: PurchasePayment;
        indexes: {
            'by-purchase': string;
            'by-date': string;
        };
    };
}

const DB_NAME = 'western-pharmacy-purchases';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PurchaseDB> | null = null;

/** Get or initialize purchase database */
async function getDB(): Promise<IDBPDatabase<PurchaseDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<PurchaseDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Suppliers store
            if (!db.objectStoreNames.contains('suppliers')) {
                const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id' });
                supplierStore.createIndex('by-name', 'name');
                supplierStore.createIndex('by-gstin', 'gstin');
            }

            // Purchases store
            if (!db.objectStoreNames.contains('purchases')) {
                const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
                purchaseStore.createIndex('by-supplier', 'supplierId');
                purchaseStore.createIndex('by-date', 'receivedDate');
                purchaseStore.createIndex('by-status', 'status');
            }

            // Payments store
            if (!db.objectStoreNames.contains('payments')) {
                const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
                paymentStore.createIndex('by-purchase', 'purchaseOrderId');
                paymentStore.createIndex('by-date', 'paymentDate');
            }
        }
    });

    return dbInstance;
}

/** Generate unique ID */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============ SUPPLIER CRUD ============

/** Get all suppliers */
export async function getAllSuppliers(): Promise<Supplier[]> {
    const db = await getDB();
    const suppliers = await db.getAll('suppliers');
    return suppliers.filter(s => s.isActive).sort((a, b) => a.name.localeCompare(b.name));
}

/** Get supplier by ID */
export async function getSupplier(id: string): Promise<Supplier | undefined> {
    const db = await getDB();
    return db.get('suppliers', id);
}

/** Add new supplier */
export async function addSupplier(data: SupplierFormData): Promise<Supplier> {
    const db = await getDB();
    const now = new Date().toISOString();

    const supplier: Supplier = {
        id: generateId(),
        ...data,
        isActive: true,
        createdAt: now,
        updatedAt: now
    };

    await db.put('suppliers', supplier);
    return supplier;
}

/** Update supplier */
export async function updateSupplier(id: string, data: Partial<SupplierFormData>): Promise<Supplier | undefined> {
    const db = await getDB();
    const existing = await db.get('suppliers', id);
    if (!existing) return undefined;

    const updated: Supplier = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
    };

    await db.put('suppliers', updated);
    return updated;
}

/** Delete supplier (soft delete) */
export async function deleteSupplier(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('suppliers', id);
    if (!existing) return false;

    const updated: Supplier = {
        ...existing,
        isActive: false,
        updatedAt: new Date().toISOString()
    };

    await db.put('suppliers', updated);
    return true;
}

// ============ PURCHASE ORDER CRUD ============

/** Get all purchase orders */
export async function getAllPurchases(): Promise<PurchaseOrder[]> {
    const db = await getDB();
    const purchases = await db.getAll('purchases');
    return purchases.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
}

/** Get purchases by supplier */
export async function getPurchasesBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    const db = await getDB();
    return db.getAllFromIndex('purchases', 'by-supplier', supplierId);
}

/** Get purchase by ID */
export async function getPurchase(id: string): Promise<PurchaseOrder | undefined> {
    const db = await getDB();
    return db.get('purchases', id);
}

/** Generate next PO number */
export async function getNextPONumber(): Promise<string> {
    const db = await getDB();
    const purchases = await db.getAll('purchases');
    const count = purchases.length + 1;
    return `PO-${String(count).padStart(5, '0')}`;
}

/** Create purchase order */
export async function createPurchase(
    data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PurchaseOrder> {
    const db = await getDB();
    const now = new Date().toISOString();

    const purchase: PurchaseOrder = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now
    };

    await db.put('purchases', purchase);
    return purchase;
}

/** Update purchase order */
export async function updatePurchase(
    id: string,
    data: Partial<Omit<PurchaseOrder, 'id' | 'createdAt'>>
): Promise<PurchaseOrder | undefined> {
    const db = await getDB();
    const existing = await db.get('purchases', id);
    if (!existing) return undefined;

    const updated: PurchaseOrder = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
    };

    await db.put('purchases', updated);
    return updated;
}

// ============ PAYMENT TRACKING ============

/** Get payments for a purchase order */
export async function getPaymentsForPurchase(purchaseOrderId: string): Promise<PurchasePayment[]> {
    const db = await getDB();
    return db.getAllFromIndex('payments', 'by-purchase', purchaseOrderId);
}

/** Add payment to purchase order */
export async function addPayment(
    purchaseOrderId: string,
    amount: number,
    paymentMode: PurchasePayment['paymentMode'],
    reference?: string,
    notes?: string
): Promise<PurchasePayment> {
    const db = await getDB();
    const now = new Date().toISOString();

    const payment: PurchasePayment = {
        id: generateId(),
        purchaseOrderId,
        amount,
        paymentMode,
        reference,
        notes,
        paymentDate: now,
        createdAt: now
    };

    await db.put('payments', payment);

    // Update purchase order paid amount
    const purchase = await db.get('purchases', purchaseOrderId);
    if (purchase) {
        const payments = await getPaymentsForPurchase(purchaseOrderId);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        await updatePurchase(purchaseOrderId, {
            paidAmount: totalPaid,
            balanceAmount: purchase.grandTotal - totalPaid,
            paymentStatus: totalPaid >= purchase.grandTotal ? 'paid' :
                totalPaid > 0 ? 'partial' : 'pending'
        });
    }

    return payment;
}

// ============ SUMMARY/REPORTS ============

/** Get purchase summary for dashboard */
export async function getPurchaseSummary() {
    const db = await getDB();
    const purchases = await db.getAll('purchases');
    const suppliers = await db.getAll('suppliers');

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthPurchases = purchases.filter(p => new Date(p.receivedDate) >= thisMonth);
    const pendingPayments = purchases.filter(p => p.paymentStatus !== 'paid');

    // Top suppliers by purchase value
    const supplierTotals = new Map<string, number>();
    purchases.forEach(p => {
        const current = supplierTotals.get(p.supplierName) || 0;
        supplierTotals.set(p.supplierName, current + p.grandTotal);
    });

    const topSuppliers = Array.from(supplierTotals.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return {
        totalPurchases: purchases.reduce((sum, p) => sum + p.grandTotal, 0),
        pendingPayments: pendingPayments.reduce((sum, p) => sum + p.balanceAmount, 0),
        suppliersCount: suppliers.filter(s => s.isActive).length,
        thisMonthPurchases: thisMonthPurchases.reduce((sum, p) => sum + p.grandTotal, 0),
        topSuppliers
    };
}
