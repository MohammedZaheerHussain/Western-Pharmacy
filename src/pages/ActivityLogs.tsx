/**
 * Activity Logs Page
 * Premium feature for viewing all system activity
 */

import { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { ActivityAction, ROLE_DISPLAY } from '../types/user';
import {
    Activity, Search, Package, Receipt, FileText, Settings, Users,
    LogIn, LogOut, Plus, Edit2, Trash2, Download, Eye, Shield
} from 'lucide-react';

// Action icons and colors
const ACTION_CONFIG: Record<ActivityAction, { icon: typeof Activity; color: string; label: string }> = {
    login: { icon: LogIn, color: 'text-green-500', label: 'Login' },
    logout: { icon: LogOut, color: 'text-gray-400', label: 'Logout' },
    create: { icon: Plus, color: 'text-blue-500', label: 'Created' },
    update: { icon: Edit2, color: 'text-amber-500', label: 'Updated' },
    delete: { icon: Trash2, color: 'text-red-500', label: 'Deleted' },
    view: { icon: Eye, color: 'text-gray-400', label: 'Viewed' },
    export: { icon: Download, color: 'text-purple-500', label: 'Exported' },
    import: { icon: Download, color: 'text-indigo-500', label: 'Imported' },
    bill_create: { icon: Receipt, color: 'text-green-500', label: 'Bill Created' },
    bill_void: { icon: Receipt, color: 'text-red-500', label: 'Bill Voided' },
    bill_edit: { icon: Receipt, color: 'text-amber-500', label: 'Bill Edited' },
    discount_apply: { icon: Receipt, color: 'text-orange-500', label: 'Discount Applied' },
    settlement_complete: { icon: FileText, color: 'text-emerald-500', label: 'Settlement' },
    settings_change: { icon: Settings, color: 'text-gray-500', label: 'Settings Changed' },
    staff_add: { icon: Users, color: 'text-blue-500', label: 'Staff Added' },
    staff_remove: { icon: Users, color: 'text-red-500', label: 'Staff Removed' },
    role_change: { icon: Shield, color: 'text-purple-500', label: 'Role Changed' }
};

// Entity icons
const ENTITY_ICONS: Record<string, typeof Package> = {
    medicine: Package,
    bill: Receipt,
    supplier: Users,
    purchase: FileText,
    staff: Users,
    settings: Settings
};

export function ActivityLogs() {
    const { permissions, activityLogs, loadActivityLogs } = useRole();

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<ActivityAction | 'all'>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Load logs on mount
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await loadActivityLogs(500);
            setLoading(false);
        };
        load();
    }, [loadActivityLogs]);

    // Filter logs
    const filteredLogs = activityLogs.filter(log => {
        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matches =
                log.userName.toLowerCase().includes(query) ||
                log.entity.toLowerCase().includes(query) ||
                log.details?.toLowerCase().includes(query) ||
                log.entityName?.toLowerCase().includes(query);
            if (!matches) return false;
        }

        // Action filter
        if (actionFilter !== 'all' && log.action !== actionFilter) return false;

        // User filter
        if (userFilter !== 'all' && log.userId !== userFilter) return false;

        // Date range
        if (dateFrom) {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            if (logDate < dateFrom) return false;
        }
        if (dateTo) {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            if (logDate > dateTo) return false;
        }

        return true;
    });

    // Get unique users from logs
    const uniqueUsers = Array.from(new Set(activityLogs.map(l => l.userId)))
        .map(userId => {
            const log = activityLogs.find(l => l.userId === userId);
            return { id: userId, name: log?.userName || 'Unknown' };
        });

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!permissions.canViewActivityLogs) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Access Restricted
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        You don't have permission to view activity logs.
                        <br />
                        Contact your pharmacy owner for access.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Activity className="text-indigo-500" />
                    Activity Logs
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track all system activity and user actions
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 
                                         rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value as ActivityAction | 'all')}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                        <option value="all">All Actions</option>
                        <option value="create">Created</option>
                        <option value="update">Updated</option>
                        <option value="delete">Deleted</option>
                        <option value="bill_create">Bills</option>
                        <option value="login">Logins</option>
                        <option value="settings_change">Settings</option>
                    </select>

                    {/* User Filter */}
                    <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                        <option value="all">All Users</option>
                        {uniqueUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Loading activity logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery || actionFilter !== 'all' || userFilter !== 'all' || dateFrom || dateTo
                                ? 'No logs match your filters'
                                : 'No activity logs yet'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredLogs.map(log => {
                            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
                            const ActionIcon = config.icon;
                            const EntityIcon = ENTITY_ICONS[log.entity] || FileText;

                            return (
                                <div
                                    key={log.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Action Icon */}
                                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${config.color}`}>
                                            <ActionIcon size={18} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* User */}
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {log.userName}
                                                </span>

                                                {/* Role badge */}
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_DISPLAY[log.userRole].color}`}>
                                                    {ROLE_DISPLAY[log.userRole].label}
                                                </span>

                                                {/* Action */}
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {config.label.toLowerCase()}
                                                </span>

                                                {/* Entity */}
                                                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                                    <EntityIcon size={14} />
                                                    {log.entityName || log.entity}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            {log.details && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {log.details}
                                                </p>
                                            )}

                                            {/* Changes */}
                                            {log.changes && log.changes.length > 0 && (
                                                <div className="mt-2 text-xs space-y-1">
                                                    {log.changes.slice(0, 3).map((change, i) => (
                                                        <div key={i} className="text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">{change.field}:</span>{' '}
                                                            <span className="text-red-400 line-through">{String(change.oldValue)}</span>
                                                            {' → '}
                                                            <span className="text-green-400">{String(change.newValue)}</span>
                                                        </div>
                                                    ))}
                                                    {log.changes.length > 3 && (
                                                        <span className="text-gray-400">
                                                            +{log.changes.length - 3} more changes
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-right text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            {formatTime(log.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Load More */}
            {filteredLogs.length > 0 && filteredLogs.length >= 100 && (
                <div className="text-center mt-4">
                    <button
                        onClick={() => loadActivityLogs(activityLogs.length + 100)}
                        className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 
                                 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
