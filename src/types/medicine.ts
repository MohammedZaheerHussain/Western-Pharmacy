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

/** Individual batch with its own batch number, expiry, quantity, and price */
export interface Batch {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitPrice: number; // Price per strip for this specific batch

    // Purchase tracking (Pro/Premium feature)
    purchasePrice?: number;     // Cost price per strip
    supplierId?: string;        // Which supplier
    purchaseOrderId?: string;   // Which PO
    margin?: number;            // Profit margin %
}

export interface Medicine {
    id: string;
    name: string;
    brand: string;
    salt: string;
    category: MedicineCategory;
    schedule?: MedicineSchedule; // Optional drug schedule (OTC, G, H, H1, X, C/C1, E1)

    // Tablet/Strip configuration for loose medicine billing
    // tabletsPerStrip: Number of tablets in one strip (default: 1 for non-strip items)
    // When tabletsPerStrip > 1, quantity is tracked in TABLETS, unitPrice is per STRIP
    tabletsPerStrip: number;

    // Multi-batch support (new medicines)
    batches?: Batch[];

    // Legacy single-batch fields (for backward compatibility with existing data)
    // If batches[] exists, these are computed/derived values
    quantity: number; // Total quantity in TABLETS (smallest unit)
    batchNumber: string; // Primary batch number or empty if multi-batch
    expiryDate: string; // Earliest expiry date

    unitPrice: number; // Price per STRIP in INR
    location: MedicineLocation;

    // GST fields
    hsn?: string;      // HSN code (default: 3004 for medicines)
    taxRate?: number;  // GST rate: 0, 5, 12, or 18

    // Barcode (Pro feature)
    barcode?: string;  // EAN/UPC barcode for quick scanning

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

// Drug Schedule Types (Indian NDPS & Drug Schedule)
export type MedicineSchedule = 'OTC' | 'G' | 'H' | 'H1' | 'X' | 'C' | 'C1' | 'E1';

export const MEDICINE_SCHEDULES: { value: MedicineSchedule; label: string; description: string }[] = [
    { value: 'OTC', label: 'OTC', description: 'Over The Counter - No prescription needed' },
    { value: 'G', label: 'G', description: 'General - Advisory only' },
    { value: 'H', label: 'H', description: 'Hospital - Prescription required' },
    { value: 'H1', label: 'H1', description: 'Restricted - Rx required, 3yr records' },
    { value: 'X', label: 'X', description: 'Narcotic - Strict control' },
    { value: 'C', label: 'C', description: 'NDPS Schedule - Special storage' },
    { value: 'C1', label: 'C1', description: 'NDPS Schedule - Special storage' },
    { value: 'E1', label: 'E1', description: 'Emergency - Warning required' },
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
    quantity: number; // Total tablets sold
    unitPrice: number; // Price per strip
    tabletsPerStrip: number; // Tablets per strip (for price calculation)
    stripQty: number; // Full strips sold
    looseQty: number; // Loose tablets sold (0 to tabletsPerStrip-1)
    total: number; // (stripQty × unitPrice) + (looseQty × unitPrice/tabletsPerStrip)
}

/** Complete bill record */
export interface Bill {
    id: string;
    billNumber: string; // Format: "BILL-0001"
    customerName?: string; // Optional customer name
    customerPhone?: string; // Optional customer phone
    doctorName?: string; // Optional prescribing doctor name
    items: BillItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    grandTotal: number;
    createdAt: string;
}

/** Cart item for billing (extends BillItem with available stock) */
export interface CartItem extends BillItem {
    availableStock: number; // Available stock in tablets
}
