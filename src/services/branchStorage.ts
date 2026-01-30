/**
 * Branch Storage Service
 * IndexedDB CRUD for multi-branch management
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Branch } from '../types/user';

// DB Schema for branches
interface BranchDB extends DBSchema {
    branches: {
        key: string;
        value: Branch;
        indexes: {
            'by-code': string;
            'by-name': string;
        };
    };
}

const DB_NAME = 'western-pharmacy-branches';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<BranchDB> | null = null;

async function getDB(): Promise<IDBPDatabase<BranchDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<BranchDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('branches')) {
                const store = db.createObjectStore('branches', { keyPath: 'id' });
                store.createIndex('by-code', 'code', { unique: true });
                store.createIndex('by-name', 'name');
            }
        }
    });

    return dbInstance;
}

function generateId(): string {
    return `br_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ BRANCH CRUD ============

export async function getAllBranches(): Promise<Branch[]> {
    const db = await getDB();
    return db.getAll('branches');
}

export async function getBranchById(id: string): Promise<Branch | undefined> {
    const db = await getDB();
    return db.get('branches', id);
}

export async function getBranchByCode(code: string): Promise<Branch | undefined> {
    const db = await getDB();
    const index = db.transaction('branches').store.index('by-code');
    return index.get(code.toUpperCase());
}

export async function createBranch(
    data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Branch> {
    const db = await getDB();
    const now = new Date().toISOString();

    const branch: Branch = {
        id: generateId(),
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address,
        city: data.city,
        phone: data.phone,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault,
        createdAt: now,
        updatedAt: now
    };

    // If this is first branch or marked as default, set as default
    const allBranches = await getAllBranches();
    if (allBranches.length === 0 || data.isDefault) {
        branch.isDefault = true;
        // Unset other defaults
        for (const b of allBranches) {
            if (b.isDefault) {
                await updateBranch(b.id, { isDefault: false });
            }
        }
    }

    await db.put('branches', branch);
    return branch;
}

export async function updateBranch(
    id: string,
    updates: Partial<Omit<Branch, 'id' | 'createdAt'>>
): Promise<Branch | undefined> {
    const db = await getDB();
    const existing = await db.get('branches', id);
    if (!existing) return undefined;

    const updated: Branch = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // If setting as default, unset other defaults
    if (updates.isDefault) {
        const allBranches = await getAllBranches();
        for (const b of allBranches) {
            if (b.id !== id && b.isDefault) {
                await db.put('branches', { ...b, isDefault: false, updatedAt: new Date().toISOString() });
            }
        }
    }

    await db.put('branches', updated);
    return updated;
}

export async function deleteBranch(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('branches', id);
    if (!existing) return false;

    await db.delete('branches', id);

    // If this was default, set another as default
    if (existing.isDefault) {
        const remaining = await getAllBranches();
        if (remaining.length > 0) {
            await updateBranch(remaining[0].id, { isDefault: true });
        }
    }

    return true;
}

export async function getDefaultBranch(): Promise<Branch | undefined> {
    const branches = await getAllBranches();
    return branches.find(b => b.isDefault) || branches[0];
}

// ============ CURRENT BRANCH MANAGEMENT ============

const CURRENT_BRANCH_KEY = 'currentBranchId';

export function setCurrentBranchId(branchId: string): void {
    localStorage.setItem(CURRENT_BRANCH_KEY, branchId);
}

export function getCurrentBranchId(): string | null {
    return localStorage.getItem(CURRENT_BRANCH_KEY);
}

export async function getCurrentBranch(): Promise<Branch | undefined> {
    const id = getCurrentBranchId();
    if (id) {
        const branch = await getBranchById(id);
        if (branch) return branch;
    }
    // Fallback to default
    const defaultBranch = await getDefaultBranch();
    if (defaultBranch) {
        setCurrentBranchId(defaultBranch.id);
    }
    return defaultBranch;
}
