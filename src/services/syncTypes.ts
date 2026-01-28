// Sync metadata types for offline-first architecture
// Used to track sync status of local records

export interface SyncMetadata {
    /** UUID for cloud sync (matches Supabase ID) */
    syncId: string | null;

    /** Current sync status */
    syncStatus: 'pending' | 'synced' | 'conflict' | 'error';

    /** Timestamp of last successful sync */
    lastSyncedAt: string | null;

    /** Version number for conflict detection */
    version: number;

    /** Soft delete timestamp (for sync deletion) */
    deletedAt?: string | null;
}

export interface SyncQueueItem {
    /** Unique ID for the queue item */
    id: string;

    /** Type of entity being synced */
    entityType: 'medicine' | 'bill' | 'settings';

    /** Local ID of the entity */
    localId: string;

    /** Type of operation */
    operation: 'create' | 'update' | 'delete';

    /** Timestamp when queued */
    queuedAt: string;

    /** Number of retry attempts */
    retryCount: number;

    /** Last error message if failed */
    lastError?: string;

    /** Data payload for create/update operations */
    payload?: unknown;
}

export interface SyncResult {
    success: boolean;
    syncedCount: number;
    failedCount: number;
    errors: Array<{ localId: string; error: string }>;
}

export interface ConflictInfo {
    localId: string;
    entityType: 'medicine' | 'bill';
    localVersion: number;
    cloudVersion: number;
    localData: unknown;
    cloudData: unknown;
    resolvedAt?: string;
    resolution?: 'local' | 'cloud' | 'merged';
}

/** Default sync metadata for new records */
export function createSyncMetadata(): SyncMetadata {
    return {
        syncId: null,
        syncStatus: 'pending',
        lastSyncedAt: null,
        version: 1,
        deletedAt: null
    };
}

/** Generate a UUID v4 for sync IDs */
export function generateSyncId(): string {
    return crypto.randomUUID();
}
