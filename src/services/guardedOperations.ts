/**
 * Guarded Operations Service
 * Wraps all write operations with license enforcement
 * 
 * This is the SECOND LAYER of defense after UI guards.
 * Even if UI bugs let a write through, this blocks it.
 * 
 * Usage: Import from this module instead of storage.ts for write operations
 */

import { LicenseStatus, assertLicenseActive } from './licenseGuard';
import * as storage from './storage';
import { Medicine, BillItem, Bill, MedicineLocation } from '../types/medicine';
import { BackupData } from '../services/storage';

// Store license status globally - set by App on mount and updates
let currentLicenseStatus: LicenseStatus | null = null;

/**
 * Set the current license status
 * Called by App component when license status changes
 */
export function setLicenseStatus(status: LicenseStatus): void {
    currentLicenseStatus = status;
}

/**
 * Get current license status
 */
export function getLicenseStatus(): LicenseStatus | null {
    return currentLicenseStatus;
}

/**
 * Assert license is active before write operation
 * @throws LicenseExpiredError if license is expired and not in grace period
 */
function guardWrite(): void {
    if (!currentLicenseStatus) {
        // If no license status set, allow operation (for initial setup)
        console.warn('License status not set - allowing write operation');
        return;
    }
    assertLicenseActive(currentLicenseStatus);
}

// ============ GUARDED MEDICINE OPERATIONS ============

export async function addMedicine(
    medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>
): Promise<Medicine> {
    guardWrite();
    return storage.addMedicine(medicine);
}

export async function updateMedicine(
    id: string,
    updates: Partial<Omit<Medicine, 'id' | 'createdAt' | 'auditHistory'>>
): Promise<Medicine | undefined> {
    guardWrite();
    return storage.updateMedicine(id, updates);
}

export async function deleteMedicine(id: string): Promise<boolean> {
    guardWrite();
    return storage.deleteMedicine(id);
}

export async function bulkDeleteMedicines(ids: string[]): Promise<number> {
    guardWrite();
    return storage.bulkDeleteMedicines(ids);
}

export async function bulkUpdateLocation(
    ids: string[],
    location: MedicineLocation
): Promise<number> {
    guardWrite();
    return storage.bulkUpdateLocation(ids, location);
}

export async function importMedicines(
    medicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[]
): Promise<Medicine[]> {
    guardWrite();
    return storage.importMedicines(medicines);
}

// ============ GUARDED BILLING OPERATIONS ============

export async function createBill(
    items: BillItem[],
    discountPercent?: number,
    customerName?: string,
    customerPhone?: string,
    doctorName?: string
): Promise<Bill> {
    guardWrite();
    return storage.createBill(items, discountPercent, customerName, customerPhone, doctorName);
}

export async function updateBill(
    billId: string,
    newItems: BillItem[],
    discountPercent: number | undefined,
    originalItems: BillItem[],
    customerName?: string,
    customerPhone?: string,
    doctorName?: string
): Promise<Bill> {
    guardWrite();
    return storage.updateBill(billId, newItems, discountPercent, originalItems, customerName, customerPhone, doctorName);
}

export async function deleteBill(id: string): Promise<boolean> {
    guardWrite();
    return storage.deleteBill(id);
}

// ============ GUARDED BACKUP OPERATIONS ============

export async function restoreFromBackup(
    backupData: BackupData,
    options?: { clearExisting?: boolean; mergeMode?: 'skip' | 'overwrite' }
): Promise<{ medicinesRestored: number; billsRestored: number }> {
    guardWrite();
    return storage.restoreFromBackup(backupData, options);
}

// ============ READ OPERATIONS (ALWAYS ALLOWED) ============

// Re-export read operations unchanged - no guards needed
export {
    getAllMedicines,
    getMedicine,
    getAllBills,
    getBill,
    exportBillsToCSV,
    exportToCSV,
    createFullBackup,
    downloadBackup,
    parseBackupFile,
    parseCSV,
    getTotalQuantity,
    getEarliestExpiry,
    isMultiBatch,
    getTabletPrice,
    calculateLineTotal,
    shouldShowBackupReminder,
    dismissBackupReminder,
    isBackupReminderDismissedToday,
    getLastBackupInfo,
    seedInitialData
} from './storage';

// Export error class for error boundary handling
export { LicenseExpiredError } from './licenseGuard';
