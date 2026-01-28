import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { networkStatus } from './networkStatus';
import {
    SyncQueueItem,
    SyncResult,
    generateSyncId
} from './syncTypes';

// IndexedDB store name for sync queue
const SYNC_STATUS_KEY = 'sync-last-status';

class SyncService {
    private supabase: SupabaseClient | null = null;
    private clientId: string | null = null;
    private isSyncing: boolean = false;
    private syncInterval: number | null = null;
    private listeners: Set<(status: SyncStatus) => void> = new Set();

    constructor() {
        // Initialize Supabase client
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }

        // Start listening for network changes
        networkStatus.subscribe((isOnline) => {
            if (isOnline) {
                console.log('[SyncService] Network online - starting sync');
                this.syncNow();
            }
        });
    }

    /** Initialize sync service with client ID (call after login) */
    initialize(clientId: string): void {
        this.clientId = clientId;
        console.log(`[SyncService] Initialized for client: ${clientId}`);

        // Start periodic sync (every 5 minutes)
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = window.setInterval(() => {
            if (networkStatus.isOnline) {
                this.syncNow();
            }
        }, 5 * 60 * 1000);

        // Initial sync
        if (networkStatus.isOnline) {
            this.syncNow();
        }
    }

    /** Stop sync service (call on logout) */
    stop(): void {
        this.clientId = null;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /** Subscribe to sync status changes */
    subscribe(callback: (status: SyncStatus) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /** Queue an item for sync */
    async queueSync(
        entityType: 'medicine' | 'bill' | 'settings',
        localId: string,
        operation: 'create' | 'update' | 'delete',
        payload?: unknown
    ): Promise<void> {
        const item: SyncQueueItem = {
            id: generateSyncId(),
            entityType,
            localId,
            operation,
            queuedAt: new Date().toISOString(),
            retryCount: 0,
            payload
        };

        await this.addToQueue(item);
        this.notifyListeners({ pendingCount: await this.getQueueCount() });

        // Try to sync immediately if online
        if (networkStatus.isOnline && !this.isSyncing) {
            this.syncNow();
        }
    }

    /** Trigger immediate sync */
    async syncNow(): Promise<SyncResult> {
        if (!this.supabase || !this.clientId) {
            return { success: false, syncedCount: 0, failedCount: 0, errors: [{ localId: '', error: 'Sync not initialized' }] };
        }

        if (this.isSyncing) {
            return { success: false, syncedCount: 0, failedCount: 0, errors: [{ localId: '', error: 'Sync already in progress' }] };
        }

        if (!networkStatus.isOnline) {
            return { success: false, syncedCount: 0, failedCount: 0, errors: [{ localId: '', error: 'Offline' }] };
        }

        this.isSyncing = true;
        this.notifyListeners({ syncing: true });

        try {
            const result = await this.processQueue();
            this.notifyListeners({
                syncing: false,
                lastSyncedAt: new Date().toISOString(),
                pendingCount: await this.getQueueCount()
            });

            // Save last sync status
            localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
                lastSyncedAt: new Date().toISOString(),
                result
            }));

            return result;
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            this.notifyListeners({ syncing: false, error: String(error) });
            return { success: false, syncedCount: 0, failedCount: 1, errors: [{ localId: '', error: String(error) }] };
        } finally {
            this.isSyncing = false;
        }
    }

    /** Process all items in the sync queue */
    private async processQueue(): Promise<SyncResult> {
        const queue = await this.getQueue();
        let syncedCount = 0;
        let failedCount = 0;
        const errors: Array<{ localId: string; error: string }> = [];

        for (const item of queue) {
            try {
                await this.syncItem(item);
                await this.removeFromQueue(item.id);
                syncedCount++;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                // Update retry count
                item.retryCount++;
                item.lastError = errorMsg;

                if (item.retryCount >= 3) {
                    // Max retries reached, move to failed
                    await this.removeFromQueue(item.id);
                    errors.push({ localId: item.localId, error: errorMsg });
                    failedCount++;
                } else {
                    // Update queue item for retry
                    await this.updateQueueItem(item);
                }
            }
        }

        return { success: failedCount === 0, syncedCount, failedCount, errors };
    }

    /** Sync a single item to Supabase */
    private async syncItem(item: SyncQueueItem): Promise<void> {
        if (!this.supabase || !this.clientId) {
            throw new Error('Sync not initialized');
        }

        const tableName = item.entityType === 'medicine' ? 'client_medicines' :
            item.entityType === 'bill' ? 'client_bills' : 'client_settings';

        switch (item.operation) {
            case 'create':
            case 'update': {
                const { error } = await this.supabase
                    .from(tableName)
                    .upsert({
                        client_id: this.clientId,
                        local_id: item.localId,
                        data: item.payload,
                        synced_at: new Date().toISOString()
                    }, { onConflict: 'client_id,local_id' });

                if (error) throw error;
                break;
            }
            case 'delete': {
                const { error } = await this.supabase
                    .from(tableName)
                    .update({ deleted_at: new Date().toISOString() })
                    .match({ client_id: this.clientId, local_id: item.localId });

                if (error) throw error;
                break;
            }
        }
    }

    /** Pull data from cloud and merge with local */
    async pullFromCloud(): Promise<{ medicines: number; bills: number }> {
        if (!this.supabase || !this.clientId) {
            throw new Error('Sync not initialized');
        }

        // Fetch medicines
        const { data: medicines, error: medError } = await this.supabase
            .from('client_medicines')
            .select('*')
            .eq('client_id', this.clientId)
            .is('deleted_at', null);

        if (medError) throw medError;

        // Fetch bills
        const { data: bills, error: billError } = await this.supabase
            .from('client_bills')
            .select('*')
            .eq('client_id', this.clientId)
            .is('deleted_at', null);

        if (billError) throw billError;

        // TODO: Merge with local IndexedDB data
        // This would need to compare versions and handle conflicts

        return {
            medicines: medicines?.length || 0,
            bills: bills?.length || 0
        };
    }

    /** Get sync queue from IndexedDB */
    private async getQueue(): Promise<SyncQueueItem[]> {
        // For now, use localStorage as a simple queue
        // In production, this should use IndexedDB for larger capacity
        const stored = localStorage.getItem('sync-queue');
        return stored ? JSON.parse(stored) : [];
    }

    /** Add item to sync queue */
    private async addToQueue(item: SyncQueueItem): Promise<void> {
        const queue = await this.getQueue();

        // Check for existing item with same entity and localId
        const existingIndex = queue.findIndex(
            q => q.entityType === item.entityType && q.localId === item.localId
        );

        if (existingIndex >= 0) {
            // Replace existing item
            queue[existingIndex] = item;
        } else {
            queue.push(item);
        }

        localStorage.setItem('sync-queue', JSON.stringify(queue));
    }

    /** Remove item from queue */
    private async removeFromQueue(id: string): Promise<void> {
        const queue = await this.getQueue();
        const filtered = queue.filter(item => item.id !== id);
        localStorage.setItem('sync-queue', JSON.stringify(filtered));
    }

    /** Update queue item */
    private async updateQueueItem(item: SyncQueueItem): Promise<void> {
        const queue = await this.getQueue();
        const index = queue.findIndex(q => q.id === item.id);
        if (index >= 0) {
            queue[index] = item;
            localStorage.setItem('sync-queue', JSON.stringify(queue));
        }
    }

    /** Get queue count */
    private async getQueueCount(): Promise<number> {
        const queue = await this.getQueue();
        return queue.length;
    }

    /** Notify all listeners of status change */
    private notifyListeners(status: Partial<SyncStatus>): void {
        const fullStatus: SyncStatus = {
            syncing: this.isSyncing,
            pendingCount: 0,
            lastSyncedAt: null,
            ...status
        };
        this.listeners.forEach(listener => listener(fullStatus));
    }

    /** Get last sync status */
    getLastSyncStatus(): { lastSyncedAt: string | null; pendingCount: number } {
        const stored = localStorage.getItem(SYNC_STATUS_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        return {
            lastSyncedAt: parsed?.lastSyncedAt || null,
            pendingCount: 0 // Will be updated async
        };
    }
}

export interface SyncStatus {
    syncing: boolean;
    pendingCount: number;
    lastSyncedAt: string | null;
    error?: string;
}

// Singleton instance
export const syncService = new SyncService();

// Re-export types and utilities
// Re-export types and utilities
export { generateSyncId };
export type { SyncQueueItem, SyncResult };
