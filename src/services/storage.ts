// IndexedDB storage service using idb library
// Provides CRUD operations with audit history support

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Medicine, AuditEntry, MedicineLocation, MEDICINE_CATEGORIES } from '../types/medicine';

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
}

const DB_NAME = 'western-pharmacy-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PharmacyDB> | null = null;

// Initialize or get database instance
async function getDB(): Promise<IDBPDatabase<PharmacyDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<PharmacyDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            const store = db.createObjectStore('medicines', { keyPath: 'id' });
            store.createIndex('by-name', 'name');
            store.createIndex('by-category', 'category');
            store.createIndex('by-expiry', 'expiryDate');
        },
    });

    return dbInstance;
}

// Generate unique ID
function generateId(): string {
    return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create audit entry
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

// Get all medicines
export async function getAllMedicines(): Promise<Medicine[]> {
    const db = await getDB();
    return db.getAll('medicines');
}

// Get medicine by ID
export async function getMedicine(id: string): Promise<Medicine | undefined> {
    const db = await getDB();
    return db.get('medicines', id);
}

// Add medicine
export async function addMedicine(
    medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>
): Promise<Medicine> {
    const db = await getDB();
    const now = new Date().toISOString();

    const newMedicine: Medicine = {
        ...medicine,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        auditHistory: [createAuditEntry('created')]
    };

    await db.add('medicines', newMedicine);
    return newMedicine;
}

// Update medicine with audit tracking
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

    const updatedMedicine: Medicine = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        auditHistory: auditEntry
            ? [...existing.auditHistory, auditEntry]
            : existing.auditHistory
    };

    await db.put('medicines', updatedMedicine);
    return updatedMedicine;
}

// Delete medicine
export async function deleteMedicine(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('medicines', id);

    if (!existing) return false;

    await db.delete('medicines', id);
    return true;
}

// Bulk delete medicines
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

// Bulk update location
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

// Import medicines from CSV data
export async function importMedicines(medicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[]): Promise<Medicine[]> {
    const db = await getDB();
    const tx = db.transaction('medicines', 'readwrite');
    const now = new Date().toISOString();

    const imported: Medicine[] = [];

    for (const medicine of medicines) {
        const newMedicine: Medicine = {
            ...medicine,
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

// Seed initial data if database is empty
export async function seedInitialData(): Promise<void> {
    const existing = await getAllMedicines();
    if (existing.length > 0) return;

    const sampleMedicines: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>[] = [
        {
            name: 'Paracetamol 500mg',
            brand: 'Crocin',
            salt: 'Paracetamol',
            category: 'Tablet',
            quantity: 150,
            location: { rack: 'A', shelf: '1', drawer: '1' },
            batchNumber: 'CR2024001',
            expiryDate: '2025-06-15'
        },
        {
            name: 'Amoxicillin 250mg',
            brand: 'Mox',
            salt: 'Amoxicillin',
            category: 'Capsule',
            quantity: 8,
            location: { rack: 'A', shelf: '2' },
            batchNumber: 'MX2024002',
            expiryDate: '2024-12-20'
        },
        {
            name: 'Cetirizine 10mg',
            brand: 'Zyrtec',
            salt: 'Cetirizine',
            category: 'Tablet',
            quantity: 45,
            location: { rack: 'B', shelf: '1', drawer: '2' },
            batchNumber: 'ZY2024003',
            expiryDate: '2025-03-10'
        },
        {
            name: 'Omeprazole 20mg',
            brand: 'Omez',
            salt: 'Omeprazole',
            category: 'Capsule',
            quantity: 0,
            location: { rack: 'B', shelf: '2' },
            batchNumber: 'OM2024004',
            expiryDate: '2025-08-05'
        },
        {
            name: 'Cough Syrup',
            brand: 'Benadryl',
            salt: 'Diphenhydramine',
            category: 'Syrup',
            quantity: 25,
            location: { rack: 'C', shelf: '1' },
            batchNumber: 'BD2024005',
            expiryDate: '2024-02-28'
        },
        {
            name: 'Insulin Injection',
            brand: 'Lantus',
            salt: 'Insulin Glargine',
            category: 'Injection',
            quantity: 12,
            location: { rack: 'D', shelf: '1', drawer: '1' },
            batchNumber: 'LT2024006',
            expiryDate: '2024-04-15'
        },
        {
            name: 'Betadine Cream',
            brand: 'Betadine',
            salt: 'Povidone-iodine',
            category: 'Cream',
            quantity: 30,
            location: { rack: 'C', shelf: '2' },
            batchNumber: 'BT2024007',
            expiryDate: '2025-11-20'
        },
        {
            name: 'Eye Drops',
            brand: 'Refresh',
            salt: 'Carboxymethylcellulose',
            category: 'Drops',
            quantity: 5,
            location: { rack: 'D', shelf: '2' },
            batchNumber: 'RF2024008',
            expiryDate: '2024-03-01'
        },
        {
            name: 'ORS Powder',
            brand: 'Electral',
            salt: 'Oral Rehydration Salts',
            category: 'Powder',
            quantity: 100,
            location: { rack: 'A', shelf: '3' },
            batchNumber: 'EL2024009',
            expiryDate: '2026-01-15'
        },
        {
            name: 'Metformin 500mg',
            brand: 'Glycomet',
            salt: 'Metformin',
            category: 'Tablet',
            quantity: 3,
            location: { rack: 'B', shelf: '3', drawer: '1' },
            batchNumber: 'GM2024010',
            expiryDate: '2025-09-30'
        },
        {
            name: 'Azithromycin 500mg',
            brand: 'Azee',
            salt: 'Azithromycin',
            category: 'Tablet',
            quantity: 20,
            location: { rack: 'A', shelf: '2', drawer: '2' },
            batchNumber: 'AZ2024011',
            expiryDate: '2024-02-15'
        },
        {
            name: 'Pantoprazole 40mg',
            brand: 'Pan',
            salt: 'Pantoprazole',
            category: 'Tablet',
            quantity: 60,
            location: { rack: 'B', shelf: '1' },
            batchNumber: 'PN2024012',
            expiryDate: '2025-05-20'
        }
    ];

    for (const medicine of sampleMedicines) {
        await addMedicine(medicine);
    }
}

// Export medicines to CSV format
export function exportToCSV(medicines: Medicine[]): string {
    const headers = [
        'Name',
        'Brand',
        'Salt/Composition',
        'Category',
        'Quantity',
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
        m.location.rack,
        m.location.shelf,
        m.location.drawer || '',
        m.batchNumber,
        m.expiryDate
    ].join(','));

    return [headers, ...rows].join('\n');
}

// Parse CSV and validate rows
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

        const category = (rowData['category'] || 'Other') as Medicine['category'];
        if (!MEDICINE_CATEGORIES.includes(category)) errors.push(`Invalid category: ${category}`);

        const expiryDate = rowData['expiry date'] || rowData['expirydate'] || rowData['expiry'] || '';
        if (!expiryDate || isNaN(Date.parse(expiryDate))) errors.push('Invalid expiry date');

        const rack = rowData['rack'] || '';
        const shelf = rowData['shelf'] || '';
        if (!rack.trim()) errors.push('Rack is required');
        if (!shelf.trim()) errors.push('Shelf is required');

        if (errors.length > 0) {
            invalid.push({ row: i + 1, data: rowData, errors });
        } else {
            valid.push({
                name: name.trim(),
                brand: (rowData['brand'] || '').trim(),
                salt: (rowData['salt'] || rowData['salt/composition'] || rowData['composition'] || '').trim(),
                category,
                quantity,
                location: {
                    rack: rack.trim(),
                    shelf: shelf.trim(),
                    drawer: (rowData['drawer'] || '').trim() || undefined
                },
                batchNumber: (rowData['batch number'] || rowData['batchnumber'] || rowData['batch'] || '').trim(),
                expiryDate: new Date(expiryDate).toISOString().split('T')[0]
            });
        }
    }

    return { valid, invalid };
}

// Helper to parse CSV line handling quoted values
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
