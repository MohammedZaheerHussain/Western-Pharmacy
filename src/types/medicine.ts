// Medicine type definitions with audit history support

export interface AuditEntry {
    id: string;
    timestamp: string;
    action: 'created' | 'updated' | 'quantity_changed';
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

export interface Medicine {
    id: string;
    name: string;
    brand: string;
    salt: string;
    category: MedicineCategory;
    quantity: number;
    location: MedicineLocation;
    batchNumber: string;
    expiryDate: string;
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
}

export interface CSVImportResult {
    valid: Medicine[];
    invalid: { row: number; data: Partial<CSVImportRow>; errors: string[] }[];
}
