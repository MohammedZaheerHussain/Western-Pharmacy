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
    const { isOnline, isSyncing, pendingCount, lastSyncedAgo, error, syncNow } = useSyncStatus();
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = async () => {
        if (isOnline && !isSyncing) {
            await syncNow();
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
                                    shadow-lg whitespace-nowrap">
                        <div className="font-medium">{label}</div>
                        <div className="text-gray-300 mt-0.5">{description}</div>
                        {pendingCount > 0 && isOnline && !isSyncing && (
                            <div className="text-blue-300 mt-1 text-[10px]">Click to sync</div>
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
