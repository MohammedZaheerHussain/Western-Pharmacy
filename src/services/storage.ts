// IndexedDB storage service using idb library
// Provides CRUD operations with audit history support + billing
// Integrated with sync service for cloud backup

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Medicine, AuditEntry, MedicineLocation, MEDICINE_CATEGORIES, Bill, BillItem } from '../types/medicine';

// Lazy-loaded sync service to avoid circular dependencies
let syncServiceInstance: {
    queueSync: (entityType: 'medicine' | 'bill' | 'settings', localId: string, operation: 'create' | 'update' | 'delete', payload?: unknown) => Promise<void>;
} | null = null;

async function getSyncService() {
    if (!syncServiceInstance) {
        try {
            const { syncService } = await import('./syncService');
            syncServiceInstance = syncService;
        } catch (e) {
            console.warn('[Storage] Sync service not available:', e);
        }
    }
    return syncServiceInstance;
}

/** Queue a sync operation (non-blocking) */
async function queueSync(
    entityType: 'medicine' | 'bill' | 'settings',
    localId: string,
    operation: 'create' | 'update' | 'delete',
    payload?: unknown
): Promise<void> {
    try {
        const syncService = await getSyncService();
        if (syncService) {
            await syncService.queueSync(entityType, localId, operation, payload);
        }
    } catch (e) {
        console.warn('[Storage] Failed to queue sync:', e);
    }
}

interface PharmacyDB extends DBSchema {
    medicines: {
        key: string;
        value: Medicine;
        indexes: {
            'by-name': string;
            'by-category': string;
            'by-expiry': string;
        };
    };
    bills: {
        key: string;
        value: Bill;
        indexes: {
            'by-date': string;
            'by-number': string;
        };
    };
    counters: {
        key: string;
        value: { id: string; value: number };
    };
}

const DB_NAME = 'western-pharmacy-db';
const DB_VERSION = 4; // v4: Added per-batch pricing

let dbInstance: IDBPDatabase<PharmacyDB> | null = null;

/**
 * Initialize or get database instance
 * Handles version upgrades gracefully
 */
async function getDB(): Promise<IDBPDatabase<PharmacyDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<PharmacyDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, _newVersion, transaction) {
            // Version 1: medicines store
            if (oldVersion < 1) {
                const medicineStore = db.createObjectStore('medicines', { keyPath: 'id' });
                medicineStore.createIndex('by-name', 'name');
                medicineStore.createIndex('by-category', 'category');
                medicineStore.createIndex('by-expiry', 'expiryDate');
            }

            // Version 2: bills and counters stores
            if (oldVersion < 2) {
                const billStore = db.createObjectStore('bills', { keyPath: 'id' });
                billStore.createIndex('by-date', 'createdAt');
                billStore.createIndex('by-number', 'billNumber');

                db.createObjectStore('counters', { keyPath: 'id' });
            }

            // Version 3: tabletsPerStrip migration for loose medicine billing
            // Converts existing stock from strips to tablets
            if (oldVersion < 3) {
                const DEFAULT_TABLETS_PER_STRIP = 10;
                const medicinesStore = transaction.objectStore('medicines');

                // We need to migrate all existing medicines
                medicinesStore.openCursor().then(function migrateMedicine(cursor): void {
                    if (!cursor) return;

                    const medicine = cursor.value;
                    // Only migrate if tabletsPerStrip is not already set
                    if (medicine.tabletsPerStrip === undefined) {
                        const tabletsPerStrip = ['Tablet', 'Capsule'].includes(medicine.category)
                            ? DEFAULT_TABLETS_PER_STRIP
                            : 1;

                        // Convert quantity from strips to tablets
                        const newQuantity = medicine.quantity * tabletsPerStrip;

                        // Also update batch quantities if present (include unitPrice for v4 compatibility)
                        const updatedBatches = medicine.batches?.map((batch: { id: string; batchNumber: string; expiryDate: string; quantity: number; unitPrice?: number }) => ({
                            ...batch,
                            quantity: batch.quantity * tabletsPerStrip,
                            unitPrice: batch.unitPrice || medicine.unitPrice || 0
                        }));

                        cursor.update({
                            ...medicine,
                            tabletsPerStrip,
                            quantity: newQuantity,
                            batches: updatedBatches || medicine.batches
                        });
                    }

                    cursor.continue().then(migrateMedicine);
                });
            }

            // Version 4: Per-batch pricing migration
            // Copies medicine-level unitPrice to each batch that doesn't have one
            if (oldVersion < 4 && oldVersion >= 3) {
                const medicinesStore = transaction.objectStore('medicines');

                medicinesStore.openCursor().then(function migrateBatchPrices(cursor): void {
                    if (!cursor) return;

                    const medicine = cursor.value;
                    const medicinePrice = medicine.unitPrice || 0;

                    // Check if any batch needs price migration
                    if (medicine.batches && medicine.batches.length > 0) {
                        const needsMigration = medicine.batches.some(
                            (batch: { unitPrice?: number }) => batch.unitPrice === undefined
                        );

                        if (needsMigration) {
                            const updatedBatches = medicine.batches.map(
                                (batch: { id: string; batchNumber: string; expiryDate: string; quantity: number; unitPrice?: number }) => ({
                                    ...batch,
                                    unitPrice: batch.unitPrice !== undefined ? batch.unitPrice : medicinePrice
                                })
                            );

                            cursor.update({
                                ...medicine,
                                batches: updatedBatches
                            });
                        }
                    }

                    cursor.continue().then(migrateBatchPrices);
                });
            }
        },
    });

    return dbInstance;
}

/** Generate unique ID */
function generateId(): string {
    return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate unique bill ID */
function generateBillId(): string {
    return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate unique batch ID */
export function generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ BATCH HELPER FUNCTIONS ============

// Batch type is used via Medicine interface

/**
 * Get total quantity across all batches
 * Works for both legacy (single batch) and multi-batch medicines
 */
export function getTotalQuantity(medicine: Medicine): number {
    if (medicine.batches && medicine.batches.length > 0) {
        return medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    }
    return medicine.quantity;
}

/**
 * Get earliest expiry date across all batches
 * Returns the soonest expiry for stock rotation (FEFO)
 */
export function getEarliestExpiry(medicine: Medicine): string {
    if (medicine.batches && medicine.batches.length > 0) {
        const sorted = [...medicine.batches].sort(
            (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
        return sorted[0]?.expiryDate || medicine.expiryDate;
    }
    return medicine.expiryDate;
}

/**
 * Check if medicine has multiple batches
 */
export function isMultiBatch(medicine: Medicine): boolean {
    return !!(medicine.batches && medicine.batches.length > 1);
}

/**
 * Normalize medicine data - ensures quantity and expiryDate are computed from batches
 * Call this before saving to keep legacy fields in sync
 */
export function normalizeMedicine(medicine: Medicine): Medicine {
    // Ensure tabletsPerStrip has a default value
    const normalized = {
        ...medicine,
        tabletsPerStrip: medicine.tabletsPerStrip || 1
    };

    if (normalized.batches && normalized.batches.length > 0) {
        return {
            ...normalized,
            quantity: getTotalQuantity(normalized),
            expiryDate: getEarliestExpiry(normalized),
            batchNumber: normalized.batches.length === 1 ? normalized.batches[0].batchNumber : ''
        };
    }
    return normalized;
}

/**
 * Get price per tablet for loose medicine billing
 * Returns unitPrice if tabletsPerStrip is 1
 */
export function getTabletPrice(medicine: Medicine): number {
    const tabletsPerStrip = medicine.tabletsPerStrip || 1;
    if (tabletsPerStrip <= 1) return medicine.unitPrice;
    return medicine.unitPrice / tabletsPerStrip;
}

/**
 * Calculate line total for strip + loose tablet billing
 */
export function calculateLineTotal(
    stripQty: number,
    looseQty: number,
    unitPrice: number,
    tabletsPerStrip: number
): number {
    const stripTotal = stripQty * unitPrice;
    const looseTotal = tabletsPerStrip > 1
        ? looseQty * (unitPrice / tabletsPerStrip)
        : 0;
    return stripTotal + looseTotal;
}

/** Create audit entry */
function createAuditEntry(
    action: AuditEntry['action'],
    changes?: AuditEntry['changes'],
    note?: string
): AuditEntry {
    return {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        changes,
        note
    };
}

// ============ MEDICINE CRUD ============

/** Get all medicines */
export async function getAllMedicines(): Promise<Medicine[]> {
    const db = await getDB();
    return db.getAll('medicines');
}

/** Get medicine by ID */
export async function getMedicine(id: string): Promise<Medicine | undefined> {
    const db = await getDB();
    return db.get('medicines', id);
}

/** Add medicine */
export async function addMedicine(
    medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>
): Promise<Medicine> {
    const db = await getDB();
    const now = new Date().toISOString();

    // Build base medicine
    let newMedicine: Medicine = {
        ...medicine,
        unitPrice: medicine.unitPrice || 0,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        auditHistory: [createAuditEntry('created')]
    };

    // Normalize if has batches - compute quantity and earliest expiry
    newMedicine = normalizeMedicine(newMedicine);

    await db.add('medicines', newMedicine);

    // Queue for cloud sync
    queueSync('medicine', newMedicine.id, 'create', newMedicine);

    return newMedicine;
}

/** Update medicine with audit tracking */
export async function updateMedicine(
    id: string,
    updates: Partial<Omit<Medicine, 'id' | 'createdAt' | 'auditHistory'>>
): Promise<Medicine | undefined> {
    const db = await getDB();
    const existing = await db.get('medicines', id);

    if (!existing) return undefined;

    const changes: AuditEntry['changes'] = [];

    // Track quantity changes specifically
    if (updates.quantity !== undefined && updates.quantity !== existing.quantity) {
        changes.push({
            field: 'quantity',
            oldValue: existing.quantity,
            newValue: updates.quantity
        });
    }

    // Track price changes
    if (updates.unitPrice !== undefined && updates.unitPrice !== existing.unitPrice) {
        changes.push({
            field: 'unitPrice',
            oldValue: existing.unitPrice || 0,
            newValue: updates.unitPrice
        });
    }

    // Track other field changes
    const trackedFields = ['name', 'brand', 'salt', 'category', 'batchNumber', 'expiryDate'] as const;
    for (const field of trackedFields) {
        if (updates[field] !== undefined && updates[field] !== existing[field]) {
            changes.push({
                field,
                oldValue: existing[field] as string,
                newValue: updates[field] as string
            });
        }
    }

    // Track location changes
    if (updates.location) {
        const locFields = ['rack', 'shelf', 'drawer'] as const;
        for (const field of locFields) {
            if (updates.location[field] !== existing.location[field]) {
                changes.push({
                    field: `location.${field}`,
                    oldValue: existing.location[field] || '',
                    newValue: updates.location[field] || ''
                });
            }
        }
    }

    const auditEntry = changes.length > 0
        ? createAuditEntry(
            changes.some(c => c.field === 'quantity') ? 'quantity_changed' : 'updated',
            changes
        )
        : null;

    let updatedMedicine: Medicine = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        auditHistory: auditEntry
            ? [...existing.auditHistory, auditEntry]
            : existing.auditHistory
    };

    // Normalize if has batches - keep quantity/expiry in sync
    updatedMedicine = normalizeMedicine(updatedMedicine);

    await db.put('medicines', updatedMedicine);

    // Queue for cloud sync
    queueSync('medicine', updatedMedicine.id, 'update', updatedMedicine);

    return updatedMedicine;
}

/** Delete medicine */
export async function deleteMedicine(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('medicines', id);

    if (!existing) return false;

    await db.delete('medicines', id);

    // Queue for cloud sync
    queueSync('medicine', id, 'delete');

    return true;
}

/** Bulk delete medicines */
export async function bulkDeleteMedicines(ids: string[]): Promise<number> {
    const db = await getDB();
    const tx = db.transaction('medicines', 'readwrite');

    let deleted = 0;
    for (const id of ids) {
        const existing = await tx.store.get(id);
        if (existing) {
            await tx.store.delete(id);
            deleted++;
        }
    }

    await tx.done;
    return deleted;
}

/** Bulk update location */
export async function bulkUpdateLocation(
    ids: string[],
    location: MedicineLocation
): Promise<number> {
    const db = await getDB();
    const tx = db.transaction('medicines', 'readwrite');

    let updated = 0;
    for (const id of ids) {
        const existing = await tx.store.get(id);
        if (existing) {
            const changes: AuditEntry['changes'] = [];
            const locFields = ['rack', 'shelf', 'drawer'] as const;
            for (const field of locFields) {
                if (location[field] !== existing.location[field]) {
                    changes.push({
                        field: `location.${field}`,
                        oldValue: existing.location[field] || '',
                        newValue: location[field] || ''
                    });
                }
            }

            const updatedMedicine: Medicine = {
                ...existing,
                location,
                updatedAt: new Date().toISOString(),
                auditHistory: changes.length > 0
                    ? [...existing.auditHistory, createAuditEntry('updated', changes, 'Bulk location update')]
                    : existing.auditHistory
            };

            await tx.store.put(updatedMedicine);
            updated++;
        }
    }

    await tx.done;
    return updated;
}

// ============ BILLING FUNCTIONS ============

/**
 * Get next bill number (auto-increment BILL-0001 format)
 */
async function getNextBillNumber(): Promise<string> {
    const db = await getDB();
    const tx = db.transaction('counters', 'readwrite');

    let counter = await tx.store.get('bill_counter');
    if (!counter) {
        counter = { id: 'bill_counter', value: 0 };
    }

    counter.value += 1;
    await tx.store.put(counter);
    await tx.done;

    return `BILL-${counter.value.toString().padStart(4, '0')}`;
}

/**
 * Create a bill and deduct stock from medicines atomically
 * @throws Error if any stock would go negative
 */
export async function createBill(
    items: BillItem[],
    discountPercent: number = 0,
    customerName?: string,
    customerPhone?: string,
    doctorName?: string
): Promise<Bill> {
    const db = await getDB();

    // Validate discount
    const validDiscount = Math.max(0, Math.min(100, discountPercent));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * validDiscount) / 100;
    const grandTotal = subtotal - discountAmount;

    // Get bill number first (outside transaction for simplicity)
    const billNumber = await getNextBillNumber();
    const now = new Date().toISOString();

    // Start transaction for medicines update
    const tx = db.transaction('medicines', 'readwrite');

    // Validate and prepare medicine updates
    for (const item of items) {
        const medicine = await tx.store.get(item.medicineId);

        if (!medicine) {
            throw new Error(`Medicine not found: ${item.medicineName}`);
        }

        if (medicine.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.medicineName}. Available: ${medicine.quantity}, Requested: ${item.quantity}`);
        }

        // Deduct stock and add audit entry
        const updatedMedicine: Medicine = {
            ...medicine,
            quantity: medicine.quantity - item.quantity,
            updatedAt: now,
            auditHistory: [
                ...medicine.auditHistory,
                createAuditEntry(
                    'sold',
                    [{ field: 'quantity', oldValue: medicine.quantity, newValue: medicine.quantity - item.quantity }],
                    `Sold ${item.quantity} units (${billNumber})`
                )
            ]
        };

        await tx.store.put(updatedMedicine);

        // Queue medicine update for sync (stock change)
        queueSync('medicine', updatedMedicine.id, 'update', updatedMedicine);
    }

    await tx.done;

    // Create the bill record
    const bill: Bill = {
        id: generateBillId(),
        billNumber,
        customerName: customerName?.trim() || undefined,
        customerPhone: customerPhone?.trim() || undefined,
        doctorName: doctorName?.trim() || undefined,
        items,
        subtotal,
        discountPercent: validDiscount,
        discountAmount,
        grandTotal,
        createdAt: now
    };

    await db.add('bills', bill);

    // Queue bill for sync
    queueSync('bill', bill.id, 'create', bill);

    return bill;
}

/**
 * Update an existing bill with new items/quantities
 * Atomically adjusts stock based on delta between original and new quantities
 * @throws Error if any stock would go negative
 */
export async function updateBill(
    billId: string,
    newItems: BillItem[],
    discountPercent: number = 0,
    originalItems: BillItem[],
    customerName?: string,
    customerPhone?: string,
    doctorName?: string
): Promise<Bill> {
    const db = await getDB();

    // Get existing bill
    const existingBill = await db.get('bills', billId);
    if (!existingBill) {
        throw new Error('Bill not found');
    }

    const now = new Date().toISOString();
    const validDiscount = Math.max(0, Math.min(100, discountPercent));

    // Calculate deltas for each medicine
    const deltaMap = new Map<string, {
        delta: number;
        oldQty: number;
        newQty: number;
        medicineName: string;
    }>();

    // Add original items to map (these need to be restocked)
    for (const item of originalItems) {
        deltaMap.set(item.medicineId, {
            delta: item.quantity, // Positive = restock
            oldQty: item.quantity,
            newQty: 0,
            medicineName: item.medicineName
        });
    }

    // Process new items (subtract from restock, or add new deduction)
    for (const item of newItems) {
        const existing = deltaMap.get(item.medicineId);
        if (existing) {
            existing.newQty = item.quantity;
            existing.delta = existing.oldQty - item.quantity; // Positive = restock, Negative = deduct more
        } else {
            // New item added (shouldn't happen in Option A, but handle gracefully)
            deltaMap.set(item.medicineId, {
                delta: -item.quantity, // Negative = deduct
                oldQty: 0,
                newQty: item.quantity,
                medicineName: item.medicineName
            });
        }
    }

    // Start transaction for medicines update
    const tx = db.transaction('medicines', 'readwrite');

    for (const [medicineId, { delta, oldQty, newQty, medicineName }] of deltaMap) {
        if (delta === 0) continue; // No change

        const medicine = await tx.store.get(medicineId);
        if (!medicine) {
            throw new Error(`Medicine not found: ${medicineName}`);
        }

        const newStock = medicine.quantity + delta;
        if (newStock < 0) {
            throw new Error(`Insufficient stock for ${medicineName}. Available: ${medicine.quantity}, Need to deduct: ${-delta}`);
        }

        // Build audit note
        let auditNote: string;
        if (delta > 0) {
            auditNote = `Edit ${existingBill.billNumber}: returned ${delta} units (qty ${oldQty}→${newQty})`;
        } else {
            auditNote = `Edit ${existingBill.billNumber}: deducted ${-delta} more units (qty ${oldQty}→${newQty})`;
        }

        const updatedMedicine: Medicine = {
            ...medicine,
            quantity: newStock,
            updatedAt: now,
            auditHistory: [
                ...medicine.auditHistory,
                createAuditEntry(
                    'sold',
                    [{ field: 'quantity', oldValue: medicine.quantity, newValue: newStock }],
                    auditNote
                )
            ]
        };

        await tx.store.put(updatedMedicine);

        // Queue medicine update for sync (stock change)
        queueSync('medicine', updatedMedicine.id, 'update', updatedMedicine);
    }

    await tx.done;

    // Filter out qty=0 items from new items
    const activeItems = newItems.filter(item => item.quantity > 0);

    // Calculate new totals
    const subtotal = activeItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * validDiscount) / 100;
    const grandTotal = subtotal - discountAmount;

    // Update the bill record
    const updatedBill: Bill = {
        ...existingBill,
        customerName: customerName?.trim() || existingBill.customerName,
        customerPhone: customerPhone?.trim() || existingBill.customerPhone,
        doctorName: doctorName?.trim() || existingBill.doctorName,
        items: activeItems,
        subtotal,
        discountPercent: validDiscount,
        discountAmount,
        grandTotal
    };

    await db.put('bills', updatedBill);

    // Queue bill update for sync
    queueSync('bill', updatedBill.id, 'update', updatedBill);

    return updatedBill;
}

/** Get all bills sorted by date (newest first) */
export async function getAllBills(): Promise<Bill[]> {
    const db = await getDB();
    const bills = await db.getAll('bills');
    return bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Get bill by ID */
export async function getBill(id: string): Promise<Bill | undefined> {
    const db = await getDB();
    return db.get('bills', id);
}

/** Delete bill (for admin purposes, doesn't restore stock) */
export async function deleteBill(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('bills', id);
    if (!existing) return false;
    await db.delete('bills', id);
    return true;
}

/** Export bills to CSV format */
export function exportBillsToCSV(bills: Bill[]): string {
    const headers = [
        'Bill Number',
        'Date',
        'Items Count',
        'Subtotal',
        'Discount %',
        'Discount Amount',
        'Grand Total'
    ].join(',');

    const rows = bills.map(b => [
        b.billNumber,
        new Date(b.createdAt).toLocaleString('en-IN'),
        b.items.length,
        b.subtotal.toFixed(2),
        b.discountPercent,
        b.discountAmount.toFixed(2),
        b.grandTotal.toFixed(2)
    ].join(','));

    return [headers, ...rows].join('\n');
}

// ============ IMPORT/EXPORT & SEED ============

/** Import medicines from CSV data */
export async function importMedicines(medicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[]): Promise<Medicine[]> {
    const db = await getDB();
    const tx = db.transaction('medicines', 'readwrite');
    const now = new Date().toISOString();

    const imported: Medicine[] = [];

    for (const medicine of medicines) {
        const newMedicine: Medicine = {
            ...medicine,
            unitPrice: medicine.unitPrice || 0,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
            auditHistory: [createAuditEntry('created', undefined, 'Imported from CSV')]
        };

        await tx.store.add(newMedicine);
        imported.push(newMedicine);
    }

    await tx.done;
    return imported;
}

// ============ FULL BACKUP SYSTEM ============

export interface BackupData {
    version: number;
    exportedAt: string;
    pharmacyName: string;
    medicines: Medicine[];
    bills: Bill[];
    counters: { id: string; value: number }[];
}

const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = 'western-pharmacy-last-backup';
const BACKUP_REMINDER_DAYS = 7;

/** Create full backup of all data */
export async function createFullBackup(pharmacyName: string = 'Western Pharmacy'): Promise<BackupData> {
    const db = await getDB();

    const medicines = await db.getAll('medicines');
    const bills = await db.getAll('bills');
    const counters = await db.getAll('counters');

    const backup: BackupData = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        pharmacyName,
        medicines,
        bills,
        counters
    };

    // Update last backup timestamp
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

    return backup;
}

/** Download backup as JSON file */
export async function downloadBackup(pharmacyName: string = 'Western Pharmacy'): Promise<void> {
    const backup = await createFullBackup(pharmacyName);
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${pharmacyName.replace(/\s+/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

/** Restore from backup file */
export async function restoreFromBackup(backupData: BackupData, options: {
    clearExisting?: boolean;
    mergeMode?: 'skip' | 'overwrite';
} = {}): Promise<{ medicinesRestored: number; billsRestored: number }> {
    const { clearExisting = false, mergeMode = 'skip' } = options;
    const db = await getDB();

    let medicinesRestored = 0;
    let billsRestored = 0;

    // Clear existing data if requested
    if (clearExisting) {
        const txClear = db.transaction(['medicines', 'bills', 'counters'], 'readwrite');
        await txClear.objectStore('medicines').clear();
        await txClear.objectStore('bills').clear();
        await txClear.objectStore('counters').clear();
        await txClear.done;
    }

    // Restore medicines
    const txMedicines = db.transaction('medicines', 'readwrite');
    for (const medicine of backupData.medicines) {
        const existing = await txMedicines.store.get(medicine.id);
        if (!existing || mergeMode === 'overwrite') {
            await txMedicines.store.put(medicine);
            medicinesRestored++;
        }
    }
    await txMedicines.done;

    // Restore bills
    const txBills = db.transaction('bills', 'readwrite');
    for (const bill of backupData.bills) {
        const existing = await txBills.store.get(bill.id);
        if (!existing || mergeMode === 'overwrite') {
            await txBills.store.put(bill);
            billsRestored++;
        }
    }
    await txBills.done;

    // Restore counters
    if (backupData.counters) {
        const txCounters = db.transaction('counters', 'readwrite');
        for (const counter of backupData.counters) {
            await txCounters.store.put(counter);
        }
        await txCounters.done;
    }

    return { medicinesRestored, billsRestored };
}

/** Parse backup file content */
export function parseBackupFile(content: string): { valid: boolean; data?: BackupData; error?: string } {
    try {
        const data = JSON.parse(content) as BackupData;

        // Validate backup structure
        if (!data.version || !data.exportedAt || !Array.isArray(data.medicines)) {
            return { valid: false, error: 'Invalid backup file format' };
        }

        if (data.version > BACKUP_VERSION) {
            return { valid: false, error: 'Backup version is newer than app version. Please update the app.' };
        }

        return { valid: true, data };
    } catch (e) {
        return { valid: false, error: 'Failed to parse backup file. Make sure it\'s a valid JSON file.' };
    }
}

/** Check if backup reminder should be shown */
export function shouldShowBackupReminder(): boolean {
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackup) return true; // Never backed up

    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceBackup >= BACKUP_REMINDER_DAYS;
}

/** Dismiss backup reminder for today */
export function dismissBackupReminder(): void {
    localStorage.setItem('backup-reminder-dismissed', new Date().toISOString());
}

/** Check if reminder was dismissed today */
export function isBackupReminderDismissedToday(): boolean {
    const dismissed = localStorage.getItem('backup-reminder-dismissed');
    if (!dismissed) return false;

    const dismissedDate = new Date(dismissed).toDateString();
    const today = new Date().toDateString();

    return dismissedDate === today;
}

/** Get last backup info */
export function getLastBackupInfo(): { date: Date | null; daysSince: number | null } {
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackup) return { date: null, daysSince: null };

    const date = new Date(lastBackup);
    const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    return { date, daysSince };
}

/** Seed initial data if database is empty */
export async function seedInitialData(): Promise<void> {
    const existing = await getAllMedicines();
    if (existing.length > 0) return;

    const sampleMedicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[] = [
        {
            name: 'Paracetamol 500mg',
            brand: 'Crocin',
            salt: 'Paracetamol',
            category: 'Tablet',
            tabletsPerStrip: 10,
            quantity: 150, // 15 strips × 10 tablets
            unitPrice: 12.50,
            location: { rack: 'A', shelf: '1', drawer: '1' },
            batchNumber: 'CR2024001',
            expiryDate: '2025-06-15'
        },
        {
            name: 'Amoxicillin 250mg',
            brand: 'Mox',
            salt: 'Amoxicillin',
            category: 'Capsule',
            tabletsPerStrip: 10,
            quantity: 80, // 8 strips × 10 tablets
            unitPrice: 28.00,
            location: { rack: 'A', shelf: '2' },
            batchNumber: 'MX2024002',
            expiryDate: '2024-12-20'
        },
        {
            name: 'Cetirizine 10mg',
            brand: 'Zyrtec',
            salt: 'Cetirizine',
            category: 'Tablet',
            tabletsPerStrip: 10,
            quantity: 450, // 45 strips × 10 tablets
            unitPrice: 8.50,
            location: { rack: 'B', shelf: '1', drawer: '2' },
            batchNumber: 'ZY2024003',
            expiryDate: '2025-03-10'
        },
        {
            name: 'Omeprazole 20mg',
            brand: 'Omez',
            salt: 'Omeprazole',
            category: 'Capsule',
            tabletsPerStrip: 15,
            quantity: 0,
            unitPrice: 15.00,
            location: { rack: 'B', shelf: '2' },
            batchNumber: 'OM2024004',
            expiryDate: '2025-08-05'
        },
        {
            name: 'Cough Syrup',
            brand: 'Benadryl',
            salt: 'Diphenhydramine',
            category: 'Syrup',
            tabletsPerStrip: 1, // Unit sale
            quantity: 25,
            unitPrice: 85.00,
            location: { rack: 'C', shelf: '1' },
            batchNumber: 'BD2024005',
            expiryDate: '2024-02-28'
        },
        {
            name: 'Insulin Injection',
            brand: 'Lantus',
            salt: 'Insulin Glargine',
            category: 'Injection',
            tabletsPerStrip: 1, // Unit sale
            quantity: 12,
            unitPrice: 450.00,
            location: { rack: 'D', shelf: '1', drawer: '1' },
            batchNumber: 'LT2024006',
            expiryDate: '2024-04-15'
        },
        {
            name: 'Betadine Cream',
            brand: 'Betadine',
            salt: 'Povidone-iodine',
            category: 'Cream',
            tabletsPerStrip: 1, // Unit sale
            quantity: 30,
            unitPrice: 65.00,
            location: { rack: 'C', shelf: '2' },
            batchNumber: 'BT2024007',
            expiryDate: '2025-11-20'
        },
        {
            name: 'Eye Drops',
            brand: 'Refresh',
            salt: 'Carboxymethylcellulose',
            category: 'Drops',
            tabletsPerStrip: 1, // Unit sale
            quantity: 5,
            unitPrice: 120.00,
            location: { rack: 'D', shelf: '2' },
            batchNumber: 'RF2024008',
            expiryDate: '2024-03-01'
        },
        {
            name: 'ORS Powder',
            brand: 'Electral',
            salt: 'Oral Rehydration Salts',
            category: 'Powder',
            tabletsPerStrip: 1, // Unit sale
            quantity: 100,
            unitPrice: 22.00,
            location: { rack: 'A', shelf: '3' },
            batchNumber: 'EL2024009',
            expiryDate: '2026-01-15'
        },
        {
            name: 'Metformin 500mg',
            brand: 'Glycomet',
            salt: 'Metformin',
            category: 'Tablet',
            tabletsPerStrip: 10,
            quantity: 30, // 3 strips × 10 tablets
            unitPrice: 18.00,
            location: { rack: 'B', shelf: '3', drawer: '1' },
            batchNumber: 'GM2024010',
            expiryDate: '2025-09-30'
        },
        {
            name: 'Azithromycin 500mg',
            brand: 'Azee',
            salt: 'Azithromycin',
            category: 'Tablet',
            tabletsPerStrip: 6, // Azithromycin typically comes in 6-pack
            quantity: 120, // 20 strips × 6 tablets
            unitPrice: 42.00,
            location: { rack: 'A', shelf: '2', drawer: '2' },
            batchNumber: 'AZ2024011',
            expiryDate: '2024-02-15'
        },
        {
            name: 'Pantoprazole 40mg',
            brand: 'Pan',
            salt: 'Pantoprazole',
            category: 'Tablet',
            tabletsPerStrip: 10,
            quantity: 600, // 60 strips × 10 tablets
            unitPrice: 14.00,
            location: { rack: 'B', shelf: '1' },
            batchNumber: 'PN2024012',
            expiryDate: '2025-05-20'
        }
    ];

    for (const medicine of sampleMedicines) {
        await addMedicine(medicine);
    }
}

/** Export medicines to CSV format */
export function exportToCSV(medicines: Medicine[]): string {
    const headers = [
        'Name',
        'Brand',
        'Salt/Composition',
        'Category',
        'Quantity',
        'Unit Price',
        'Rack',
        'Shelf',
        'Drawer',
        'Batch Number',
        'Expiry Date'
    ].join(',');

    const rows = medicines.map(m => [
        `"${m.name.replace(/"/g, '""')}"`,
        `"${m.brand.replace(/"/g, '""')}"`,
        `"${m.salt.replace(/"/g, '""')}"`,
        m.category,
        m.quantity,
        m.unitPrice?.toFixed(2) || '0.00',
        m.location.rack,
        m.location.shelf,
        m.location.drawer || '',
        m.batchNumber,
        m.expiryDate
    ].join(','));

    return [headers, ...rows].join('\n');
}

/** Parse CSV and validate rows */
export function parseCSV(csvContent: string): {
    valid: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[];
    invalid: { row: number; data: Record<string, string>; errors: string[] }[];
} {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        return { valid: [], invalid: [{ row: 1, data: {}, errors: ['File is empty or has no data rows'] }] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const valid: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[] = [];
    const invalid: { row: number; data: Record<string, string>; errors: string[] }[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
            rowData[h] = values[idx] || '';
        });

        const errors: string[] = [];

        // Validate required fields
        const name = rowData['name'] || rowData['medicine name'] || '';
        if (!name.trim()) errors.push('Name is required');

        const quantity = parseInt(rowData['quantity'] || '0', 10);
        if (isNaN(quantity) || quantity < 0) errors.push('Invalid quantity');

        const unitPrice = parseFloat(rowData['unit price'] || rowData['unitprice'] || rowData['price'] || '0');

        const category = (rowData['category'] || 'Other') as Medicine['category'];
        if (!MEDICINE_CATEGORIES.includes(category)) errors.push(`Invalid category: ${category}`);

        const expiryDate = rowData['expiry date'] || rowData['expirydate'] || rowData['expiry'] || '';

        const rack = rowData['rack'] || '';
        const shelf = rowData['shelf'] || '';

        if (errors.length > 0) {
            invalid.push({ row: i + 1, data: rowData, errors });
        } else {
            // Auto-detect tabletsPerStrip: use CSV value if provided, otherwise default based on category
            const tabletsPerStripValue = parseInt(rowData['tablets per strip'] || rowData['tabletsperstrip'] || '0', 10);
            const tabletsPerStrip = tabletsPerStripValue > 0
                ? tabletsPerStripValue
                : (['Tablet', 'Capsule'].includes(category) ? 10 : 1);

            valid.push({
                name: name.trim(),
                brand: (rowData['brand'] || '').trim(),
                salt: (rowData['salt'] || rowData['salt/composition'] || rowData['composition'] || '').trim(),
                category,
                tabletsPerStrip,
                quantity,
                unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                location: {
                    rack: rack.trim(),
                    shelf: shelf.trim(),
                    drawer: (rowData['drawer'] || '').trim() || undefined
                },
                batchNumber: (rowData['batch number'] || rowData['batchnumber'] || rowData['batch'] || '').trim(),
                expiryDate: expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : ''
            });
        }
    }

    return { valid, invalid };
}

/** Helper to parse CSV line handling quoted values */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}
