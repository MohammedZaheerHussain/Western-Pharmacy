/**
 * Role-based Access Control Context
 * Manages current user role and permissions
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { StaffMember, RolePermissions, ROLE_PERMISSIONS, ActivityLogEntry, ActivityAction } from '../types/user';

interface RoleContextType {
    // Current user
    currentUser: StaffMember | null;
    isOwner: boolean;

    // Permissions
    permissions: RolePermissions;
    hasPermission: (permission: keyof RolePermissions) => boolean;

    // Staff management
    staff: StaffMember[];
    addStaff: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
    removeStaff: (id: string) => Promise<void>;

    // Session
    switchUser: (userId: string, pin?: string) => Promise<boolean>;
    logout: () => void;

    // Activity logging
    logActivity: (action: ActivityAction, entity: string, entityId?: string, details?: string) => void;
    activityLogs: ActivityLogEntry[];
    loadActivityLogs: (limit?: number) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | null>(null);

// IndexedDB for local staff storage
const DB_NAME = 'pharmacy-staff';
const DB_VERSION = 1;

async function openStaffDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('staff')) {
                const store = db.createObjectStore('staff', { keyPath: 'id' });
                store.createIndex('email', 'email', { unique: true });
                store.createIndex('role', 'role', { unique: false });
            }

            if (!db.objectStoreNames.contains('activity_logs')) {
                const store = db.createObjectStore('activity_logs', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('action', 'action', { unique: false });
            }

            if (!db.objectStoreNames.contains('sessions')) {
                db.createObjectStore('sessions', { keyPath: 'key' });
            }
        };
    });
}

export function RoleProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Load staff and session on mount
    useEffect(() => {
        const init = async () => {
            try {
                const db = await openStaffDB();

                // Load all staff
                const tx = db.transaction('staff', 'readonly');
                const store = tx.objectStore('staff');
                const allStaff = await new Promise<StaffMember[]>((resolve, reject) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                // If no staff, create default owner
                if (allStaff.length === 0) {
                    const defaultOwner: StaffMember = {
                        id: 'owner-default',
                        email: 'owner@pharmacy.local',
                        name: 'Pharmacy Owner',
                        role: 'owner',
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    const writeTx = db.transaction('staff', 'readwrite');
                    await new Promise<void>((resolve, reject) => {
                        const request = writeTx.objectStore('staff').add(defaultOwner);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });

                    setStaff([defaultOwner]);
                    setCurrentUser(defaultOwner);
                } else {
                    setStaff(allStaff);

                    // Try to restore session
                    const sessionTx = db.transaction('sessions', 'readonly');
                    const session = await new Promise<{ key: string; userId: string } | undefined>((resolve) => {
                        const request = sessionTx.objectStore('sessions').get('current');
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => resolve(undefined);
                    });

                    if (session) {
                        const user = allStaff.find(s => s.id === session.userId);
                        if (user && user.isActive) {
                            setCurrentUser(user);
                        } else {
                            // Default to first owner
                            const owner = allStaff.find(s => s.role === 'owner' && s.isActive);
                            setCurrentUser(owner || allStaff[0]);
                        }
                    } else {
                        // Default to first owner
                        const owner = allStaff.find(s => s.role === 'owner' && s.isActive);
                        setCurrentUser(owner || allStaff[0]);
                    }
                }

                db.close();
            } catch (e) {
                console.error('Failed to initialize role context:', e);
            } finally {
                setInitialized(true);
            }
        };

        init();
    }, []);

    // Compute permissions
    const permissions = useMemo(() => {
        if (!currentUser) return ROLE_PERMISSIONS.cashier; // Most restrictive
        return ROLE_PERMISSIONS[currentUser.role];
    }, [currentUser]);

    const isOwner = currentUser?.role === 'owner';

    const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
        if (typeof permissions[permission] === 'boolean') {
            return permissions[permission] as boolean;
        }
        return true; // For numeric permissions, always true (check value separately)
    }, [permissions]);

    // Add staff member
    const addStaff = useCallback(async (newStaff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => {
        const staffMember: StaffMember = {
            ...newStaff,
            id: `staff-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const db = await openStaffDB();
        const tx = db.transaction('staff', 'readwrite');

        await new Promise<void>((resolve, reject) => {
            const request = tx.objectStore('staff').add(staffMember);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
        setStaff(prev => [...prev, staffMember]);
    }, []);

    // Update staff member
    const updateStaff = useCallback(async (id: string, updates: Partial<StaffMember>) => {
        const db = await openStaffDB();
        const tx = db.transaction('staff', 'readwrite');
        const store = tx.objectStore('staff');

        const existing = await new Promise<StaffMember | undefined>((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!existing) {
            db.close();
            throw new Error('Staff member not found');
        }

        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

        await new Promise<void>((resolve, reject) => {
            const request = store.put(updated);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
        setStaff(prev => prev.map(s => s.id === id ? updated : s));

        // Update current user if same
        if (currentUser?.id === id) {
            setCurrentUser(updated);
        }
    }, [currentUser]);

    // Remove staff member
    const removeStaff = useCallback(async (id: string) => {
        // Can't remove owner
        const member = staff.find(s => s.id === id);
        if (member?.role === 'owner' && staff.filter(s => s.role === 'owner').length <= 1) {
            throw new Error('Cannot remove the only owner');
        }

        const db = await openStaffDB();
        const tx = db.transaction('staff', 'readwrite');

        await new Promise<void>((resolve, reject) => {
            const request = tx.objectStore('staff').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
        setStaff(prev => prev.filter(s => s.id !== id));
    }, [staff]);

    // Switch user (with optional PIN)
    const switchUser = useCallback(async (userId: string, pin?: string): Promise<boolean> => {
        const user = staff.find(s => s.id === userId && s.isActive);
        if (!user) return false;

        // Check PIN if user has one
        if (user.pin && user.pin !== pin) {
            return false;
        }

        // Save session
        const db = await openStaffDB();
        const tx = db.transaction('sessions', 'readwrite');

        await new Promise<void>((resolve) => {
            const request = tx.objectStore('sessions').put({ key: 'current', userId });
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });

        // Update last login
        const staffTx = db.transaction('staff', 'readwrite');
        const updated = { ...user, lastLogin: new Date().toISOString() };
        await new Promise<void>((resolve) => {
            staffTx.objectStore('staff').put(updated);
            resolve();
        });

        db.close();
        setCurrentUser(updated);
        setStaff(prev => prev.map(s => s.id === userId ? updated : s));

        return true;
    }, [staff]);

    // Logout
    const logout = useCallback(() => {
        setCurrentUser(null);
        openStaffDB().then(db => {
            const tx = db.transaction('sessions', 'readwrite');
            tx.objectStore('sessions').delete('current');
            db.close();
        });
    }, []);

    // Log activity
    const logActivity = useCallback((
        action: ActivityAction,
        entity: string,
        entityId?: string,
        details?: string
    ) => {
        if (!currentUser) return;

        const entry: ActivityLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            action,
            entity,
            entityId,
            details
        };

        // Save to IndexedDB
        openStaffDB().then(db => {
            const tx = db.transaction('activity_logs', 'readwrite');
            tx.objectStore('activity_logs').add(entry);
            db.close();
        });

        // Update local state (prepend)
        setActivityLogs(prev => [entry, ...prev].slice(0, 500)); // Keep last 500
    }, [currentUser]);

    // Load activity logs
    const loadActivityLogs = useCallback(async (limit = 100) => {
        const db = await openStaffDB();
        const tx = db.transaction('activity_logs', 'readonly');
        const store = tx.objectStore('activity_logs');
        const index = store.index('timestamp');

        const logs: ActivityLogEntry[] = [];

        await new Promise<void>((resolve) => {
            const request = index.openCursor(null, 'prev'); // Newest first
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor && logs.length < limit) {
                    logs.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => resolve();
        });

        db.close();
        setActivityLogs(logs);
    }, []);

    if (!initialized) {
        return null; // Or loading spinner
    }

    return (
        <RoleContext.Provider value={{
            currentUser,
            isOwner,
            permissions,
            hasPermission,
            staff,
            addStaff,
            updateStaff,
            removeStaff,
            switchUser,
            logout,
            logActivity,
            activityLogs,
            loadActivityLogs
        }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}

/** Hook for checking specific permission */
export function usePermission(permission: keyof RolePermissions): boolean {
    const { hasPermission } = useRole();
    return hasPermission(permission);
}
