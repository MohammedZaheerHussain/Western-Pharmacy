// Medicine and Billing type definitions with audit history support

export interface AuditEntry {
    id: string;
    timestamp: string;
    action: 'created' | 'updated' | 'quantity_changed' | 'sold';
    changes?: {
        field: string;
        oldValue: string | number;
        newValue: string | number;
    }[];
    note?: string;
}

export interface MedicineLocation {
    rack: string;
    shelf: string;
    drawer?: string;
}

/** Individual batch with its own batch number, expiry, and quantity */
export interface Batch {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
}

export interface Medicine {
    id: string;
    name: string;
    brand: string;
    salt: string;
    category: MedicineCategory;

    // Multi-batch support (new medicines)
    batches?: Batch[];

    // Legacy single-batch fields (for backward compatibility with existing data)
    // If batches[] exists, these are computed/derived values
    quantity: number; // Total quantity (sum of all batches or legacy single value)
    batchNumber: string; // Primary batch number or empty if multi-batch
    expiryDate: string; // Earliest expiry date

    unitPrice: number; // Price in INR
    location: MedicineLocation;
    createdAt: string;
    updatedAt: string;
    auditHistory: AuditEntry[];
}

export type MedicineCategory =
    | 'Tablet'
    | 'Capsule'
    | 'Syrup'
    | 'Injection'
    | 'Cream'
    | 'Drops'
    | 'Powder'
    | 'Other';

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Cream',
    'Drops',
    'Powder',
    'Other'
];

export type StockStatus = 'ok' | 'low' | 'expiring' | 'out';

export type SortField = 'name' | 'quantity' | 'expiryDate';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

export interface FilterConfig {
    search: string;
    category: MedicineCategory | 'all';
    stockStatus: StockStatus | 'all';
}

// CSV import types
export interface CSVImportRow {
    name: string;
    brand: string;
    salt: string;
    category: string;
    quantity: string;
    rack: string;
    shelf: string;
    drawer?: string;
    batchNumber: string;
    expiryDate: string;
    unitPrice?: string;
}

export interface CSVImportResult {
    valid: Medicine[];
    invalid: { row: number; data: Partial<CSVImportRow>; errors: string[] }[];
}

// ============ BILLING TYPES ============

/** Single item in a bill */
export interface BillItem {
    medicineId: string;
    medicineName: string;
    brand: string;
    batchId?: string; // Which batch was sold from (for multi-batch medicines)
    batchNumber?: string; // Batch number for display on receipt
    quantity: number;
    unitPrice: number;
    total: number;
}

/** Complete bill record */
export interface Bill {
    id: string;
    billNumber: string; // Format: "BILL-0001"
    customerName?: string; // Optional customer name
    customerPhone?: string; // Optional customer phone
    items: BillItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    grandTotal: number;
    createdAt: string;
}

/** Cart item for billing (extends BillItem with available stock) */
export interface CartItem extends BillItem {
    availableStock: number;
}
