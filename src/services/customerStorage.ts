/**
 * Customer Storage Service
 * IndexedDB CRUD for customers and loyalty transactions
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import {
    Customer,
    LoyaltyTransaction,
    calculateTier,
    calculatePointsEarned,
    LOYALTY_CONFIG
} from '../types/customer';

// DB Schema extension for customers
interface CustomerDB extends DBSchema {
    customers: {
        key: string;
        value: Customer;
        indexes: {
            'by-phone': string;
            'by-name': string;
            'by-tier': string;
        };
    };
    loyaltyTransactions: {
        key: string;
        value: LoyaltyTransaction;
        indexes: {
            'by-customer': string;
            'by-date': string;
            'by-bill': string;
        };
    };
}

const DB_NAME = 'western-pharmacy-customers';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CustomerDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CustomerDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<CustomerDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Customers store
            if (!db.objectStoreNames.contains('customers')) {
                const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
                customerStore.createIndex('by-phone', 'phone', { unique: true });
                customerStore.createIndex('by-name', 'name');
                customerStore.createIndex('by-tier', 'tier');
            }

            // Loyalty transactions store
            if (!db.objectStoreNames.contains('loyaltyTransactions')) {
                const txStore = db.createObjectStore('loyaltyTransactions', { keyPath: 'id' });
                txStore.createIndex('by-customer', 'customerId');
                txStore.createIndex('by-date', 'createdAt');
                txStore.createIndex('by-bill', 'billId');
            }
        }
    });

    return dbInstance;
}

// Generate ID
function generateId(): string {
    return `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ CUSTOMER CRUD ============

export async function getAllCustomers(): Promise<Customer[]> {
    const db = await getDB();
    return db.getAll('customers');
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
    const db = await getDB();
    return db.get('customers', id);
}

export async function getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const db = await getDB();
    const index = db.transaction('customers').store.index('by-phone');
    return index.get(phone);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
    const db = await getDB();
    const all = await db.getAll('customers');
    const q = query.toLowerCase();
    return all.filter(c =>
        c.phone.includes(q) ||
        c.name.toLowerCase().includes(q)
    ).slice(0, 10);
}

export async function createCustomer(
    data: Pick<Customer, 'phone' | 'name' | 'email' | 'address' | 'branchId'>
): Promise<Customer> {
    const db = await getDB();
    const now = new Date().toISOString();

    const customer: Customer = {
        id: generateId(),
        phone: data.phone,
        name: data.name,
        email: data.email,
        address: data.address,
        branchId: data.branchId,

        loyaltyPoints: 0,
        totalSpent: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        tier: 'bronze',
        totalBills: 0,

        createdAt: now,
        updatedAt: now
    };

    await db.put('customers', customer);
    return customer;
}

export async function updateCustomer(
    id: string,
    updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
): Promise<Customer | undefined> {
    const db = await getDB();
    const existing = await db.get('customers', id);
    if (!existing) return undefined;

    const updated: Customer = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // Recalculate tier if totalSpent changed
    if (updates.totalSpent !== undefined) {
        updated.tier = calculateTier(updated.totalSpent);
    }

    await db.put('customers', updated);
    return updated;
}

// ============ LOYALTY TRANSACTIONS ============

export async function getLoyaltyTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
    const db = await getDB();
    const index = db.transaction('loyaltyTransactions').store.index('by-customer');
    return index.getAll(customerId);
}

export async function createLoyaltyTransaction(
    data: Omit<LoyaltyTransaction, 'id' | 'createdAt'>
): Promise<LoyaltyTransaction> {
    const db = await getDB();

    const transaction: LoyaltyTransaction = {
        ...data,
        id: `ltx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
    };

    await db.put('loyaltyTransactions', transaction);
    return transaction;
}

// ============ BILLING INTEGRATION ============

/**
 * Award points to customer after purchase
 */
export async function awardPoints(
    customerId: string,
    billId: string,
    billTotal: number,
    branchId?: string
): Promise<{ pointsEarned: number; newBalance: number }> {
    const customer = await getCustomerById(customerId);
    if (!customer) throw new Error('Customer not found');

    const pointsEarned = calculatePointsEarned(billTotal);
    const newBalance = customer.loyaltyPoints + pointsEarned;

    // Update customer
    await updateCustomer(customerId, {
        loyaltyPoints: newBalance,
        totalSpent: customer.totalSpent + billTotal,
        totalPointsEarned: customer.totalPointsEarned + pointsEarned,
        totalBills: customer.totalBills + 1,
        lastVisit: new Date().toISOString()
    });

    // Create transaction record
    await createLoyaltyTransaction({
        customerId,
        billId,
        type: 'earn',
        points: pointsEarned,
        balanceAfter: newBalance,
        description: `Earned from purchase of ₹${billTotal.toFixed(2)}`,
        branchId
    });

    return { pointsEarned, newBalance };
}

/**
 * Redeem points during purchase
 */
export async function redeemPoints(
    customerId: string,
    billId: string,
    pointsToRedeem: number,
    branchId?: string
): Promise<{ valueRedeemed: number; newBalance: number }> {
    const customer = await getCustomerById(customerId);
    if (!customer) throw new Error('Customer not found');

    if (pointsToRedeem < LOYALTY_CONFIG.minRedeemPoints) {
        throw new Error(`Minimum ${LOYALTY_CONFIG.minRedeemPoints} points required to redeem`);
    }

    if (pointsToRedeem > customer.loyaltyPoints) {
        throw new Error('Insufficient points');
    }

    const valueRedeemed = pointsToRedeem * LOYALTY_CONFIG.pointValue;
    const newBalance = customer.loyaltyPoints - pointsToRedeem;

    // Update customer
    await updateCustomer(customerId, {
        loyaltyPoints: newBalance,
        totalPointsRedeemed: customer.totalPointsRedeemed + pointsToRedeem
    });

    // Create transaction record
    await createLoyaltyTransaction({
        customerId,
        billId,
        type: 'redeem',
        points: -pointsToRedeem,
        balanceAfter: newBalance,
        description: `Redeemed for ₹${valueRedeemed.toFixed(2)} discount`,
        branchId
    });

    return { valueRedeemed, newBalance };
}
