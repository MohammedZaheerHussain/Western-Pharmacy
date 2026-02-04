// Sync Status Indicator Component
// Shows online/offline status, sync state, and pending items

import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';

interface SyncStatusIndicatorProps {
    className?: string;
    showDetails?: boolean;
}

export function SyncStatusIndicator({ className = '', showDetails = false }: SyncStatusIndicatorProps) {
    const { isOnline, isSyncing, pendingCount, lastSyncedAgo, error, fullBackup } = useSyncStatus();
    const [showTooltip, setShowTooltip] = useState(false);
    const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
    const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleClick = async () => {
        if (isOnline && !isSyncing) {
            setSyncResult(null);
            try {
                const result = await fullBackup((current, total) => {
                    setSyncProgress({ current, total });
                });
                setSyncProgress(null);
                setSyncResult({
                    success: result.errors.length === 0,
                    message: `Synced ${result.medicines} medicines, ${result.bills} bills${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`
                });
                // Clear success message after 5 seconds
                setTimeout(() => setSyncResult(null), 5000);
            } catch (e) {
                setSyncProgress(null);
                setSyncResult({
                    success: false,
                    message: String(e)
                });
            }
        }
    };

    // Determine status color and icon
    const getStatusConfig = () => {
        if (!isOnline) {
            return {
                color: 'text-orange-500',
                bgColor: 'bg-orange-100 dark:bg-orange-900/30',
                Icon: CloudOff,
                label: 'Offline',
                description: 'Changes will sync when online'
            };
        }
        if (isSyncing) {
            return {
                color: 'text-blue-500',
                bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                Icon: RefreshCw,
                label: 'Syncing...',
                description: 'Uploading your data'
            };
        }
        if (error) {
            return {
                color: 'text-red-500',
                bgColor: 'bg-red-100 dark:bg-red-900/30',
                Icon: AlertCircle,
                label: 'Sync Error',
                description: error
            };
        }
        if (pendingCount > 0) {
            return {
                color: 'text-yellow-500',
                bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
                Icon: Cloud,
                label: `${pendingCount} pending`,
                description: 'Click to sync now'
            };
        }
        // Only show "Synced" if we've actually synced before
        if (lastSyncedAgo === 'Never') {
            return {
                color: 'text-gray-400',
                bgColor: 'bg-gray-100 dark:bg-gray-700/30',
                Icon: Cloud,
                label: 'Not synced',
                description: 'Click to sync your data'
            };
        }
        return {
            color: 'text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            Icon: Check,
            label: 'Synced',
            description: `Last synced ${lastSyncedAgo}`
        };
    };

    const config = getStatusConfig();
    const { Icon, color, bgColor, label, description } = config;

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                disabled={!isOnline || isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                           ${bgColor} ${color} hover:opacity-80 disabled:cursor-default`}
                title={description}
            >
                <Icon
                    size={16}
                    className={isSyncing ? 'animate-spin' : ''}
                />
                {showDetails && (
                    <span className="text-xs font-medium">{label}</span>
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 
                                    shadow-lg whitespace-nowrap min-w-[180px]">
                        <div className="font-medium">{label}</div>
                        <div className="text-gray-300 mt-0.5">{description}</div>

                        {/* Progress indicator */}
                        {syncProgress && (
                            <div className="mt-2">
                                <div className="text-blue-300 text-[10px]">
                                    Syncing {syncProgress.current} of {syncProgress.total}...
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                                    <div
                                        className="bg-blue-400 h-1 rounded-full transition-all"
                                        style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Result feedback */}
                        {syncResult && (
                            <div className={`mt-2 text-[10px] ${syncResult.success ? 'text-green-300' : 'text-red-300'}`}>
                                {syncResult.message}
                            </div>
                        )}

                        {!isSyncing && !syncProgress && isOnline && (
                            <div className="text-blue-300 mt-1 text-[10px]">Click to backup all data</div>
                        )}
                        {/* Arrow */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 
                                        border-4 border-transparent border-b-gray-900 dark:border-b-gray-700" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact version for headers
export function SyncStatusBadge({ className = '' }: { className?: string }) {
    const { isOnline, isSyncing, pendingCount } = useSyncStatus();

    if (!isOnline) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                             bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ${className}`}>
                <CloudOff size={12} />
                Offline
            </span>
        );
    }

    if (isSyncing) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                             bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ${className}`}>
                <RefreshCw size={12} className="animate-spin" />
                Syncing
            </span>
        );
    }

    if (pendingCount > 0) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                             bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 ${className}`}>
                <Cloud size={12} />
                {pendingCount} pending
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                         bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ${className}`}>
            <Cloud size={12} />
            Synced
        </span>
    );
}
