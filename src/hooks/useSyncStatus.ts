// React hook for sync status
// Provides real-time sync status updates to components

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus } from '../services/syncService';
import { useNetworkStatus } from '../services/networkStatus';

export interface UseSyncStatusResult {
    /** Whether currently syncing */
    isSyncing: boolean;

    /** Whether online */
    isOnline: boolean;

    /** Number of pending items in queue */
    pendingCount: number;

    /** Last successful sync timestamp */
    lastSyncedAt: string | null;

    /** Time since last sync in human-readable format */
    lastSyncedAgo: string;

    /** Any sync error */
    error?: string;

    /** Trigger immediate sync (queue only) */
    syncNow: () => Promise<void>;

    /** Full backup: Push ALL local data to cloud */
    fullBackup: (onProgress?: (current: number, total: number, type: 'medicine' | 'bill') => void) => Promise<{
        medicines: number;
        bills: number;
        errors: string[];
    }>;
}

export function useSyncStatus(): UseSyncStatusResult {
    const isOnline = useNetworkStatus();
    const [status, setStatus] = useState<SyncStatus>({
        syncing: false,
        pendingCount: 0,
        lastSyncedAt: syncService.getLastSyncStatus().lastSyncedAt
    });

    useEffect(() => {
        const unsubscribe = syncService.subscribe(setStatus);
        return unsubscribe;
    }, []);

    const syncNow = useCallback(async () => {
        await syncService.syncNow();
    }, []);

    const fullBackup = useCallback(async (
        onProgress?: (current: number, total: number, type: 'medicine' | 'bill') => void
    ) => {
        setStatus(prev => ({ ...prev, syncing: true }));
        try {
            const result = await syncService.pushAllToCloud(onProgress);
            setStatus(prev => ({
                ...prev,
                syncing: false,
                lastSyncedAt: new Date().toISOString(),
                pendingCount: 0
            }));
            return result;
        } catch (error) {
            setStatus(prev => ({
                ...prev,
                syncing: false,
                error: String(error)
            }));
            throw error;
        }
    }, []);

    // Calculate time since last sync
    const getLastSyncedAgo = (): string => {
        if (!status.lastSyncedAt) return 'Never';

        const now = new Date();
        const lastSync = new Date(status.lastSyncedAt);
        const diffMs = now.getTime() - lastSync.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    return {
        isSyncing: status.syncing,
        isOnline,
        pendingCount: status.pendingCount,
        lastSyncedAt: status.lastSyncedAt,
        lastSyncedAgo: getLastSyncedAgo(),
        error: status.error,
        syncNow,
        fullBackup
    };
}
