/**
 * Dashboard Page - Overview statistics
 */

import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, ArrowRight, Plus } from 'lucide-react';
import { getDashboardStats } from '../../services/adminSupabase';

interface Stats {
    total: number;
    active: number;
    expired: number;
}

interface DashboardProps {
    onNavigateToClients: () => void;
    onNavigateToCreateClient: () => void;
}

export default function Dashboard({ onNavigateToClients, onNavigateToCreateClient }: DashboardProps) {
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <button
                    onClick={onNavigateToCreateClient}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg 
                             hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add New Client
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                    <Users size={28} className="mb-3 opacity-80" />
                    <p className="text-sm opacity-80">Total Clients</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <UserCheck size={28} className="mb-3 text-green-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Licenses</p>
                    <p className="text-3xl font-bold text-green-500">{stats.active}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <UserX size={28} className="mb-3 text-red-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
                    <p className="text-3xl font-bold text-red-500">{stats.expired}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={onNavigateToCreateClient}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 
                                 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Add Client</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Create new pharmacy client</p>
                        </div>
                        <ArrowRight size={20} className="text-gray-400" />
                    </button>
                    <button
                        onClick={onNavigateToClients}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 
                                 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">View Clients</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage all clients</p>
                        </div>
                        <ArrowRight size={20} className="text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
