/**
 * Clients List Page
 */

import { useEffect, useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import { getAllClients } from '../../services/adminSupabase';

interface Client {
    id: string;
    client_id: string;
    pharmacy_name: string;
    owner_name: string;
    phone: string;
    city: string;
    status: string;
    created_at: string;
    license_expires_at?: string;
    plans?: {
        display_name: string;
        name: string;
    };
}

interface ClientsProps {
    onNavigateToCreateClient: () => void;
    onNavigateToClientDetail: (clientId: string) => void;
}

export default function Clients({ onNavigateToCreateClient, onNavigateToClientDetail }: ClientsProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await getAllClients();
            setClients(data || []);
        } catch (error) {
            console.error('Failed to load clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.pharmacy_name.toLowerCase().includes(search.toLowerCase()) ||
        client.client_id.toLowerCase().includes(search.toLowerCase()) ||
        client.city?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const baseClass = "px-2 py-1 text-xs font-medium rounded-full";
        switch (status) {
            case 'active':
                return <span className={`${baseClass} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>Active</span>;
            case 'expired':
                return <span className={`${baseClass} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}>Expired</span>;
            case 'suspended':
                return <span className={`${baseClass} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`}>Suspended</span>;
            default:
                return <span className={`${baseClass} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
        }
    };

    const getDaysRemaining = (expiresAt: string | undefined, planName?: string): { days: number | null; label: string; color: string } => {
        // Lifetime plans don't expire
        if (planName?.includes('lifetime')) {
            return { days: null, label: '∞ Lifetime', color: 'text-green-600 dark:text-green-400' };
        }

        if (!expiresAt) {
            return { days: null, label: '-', color: 'text-gray-400' };
        }

        const now = new Date();
        const expires = new Date(expiresAt);
        const diffTime = expires.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { days: diffDays, label: 'Expired', color: 'text-red-600 dark:text-red-400' };
        } else if (diffDays <= 7) {
            return { days: diffDays, label: `${diffDays}d left`, color: 'text-red-600 dark:text-red-400' };
        } else if (diffDays <= 30) {
            return { days: diffDays, label: `${diffDays}d left`, color: 'text-yellow-600 dark:text-yellow-400' };
        } else {
            return { days: diffDays, label: `${diffDays}d left`, color: 'text-green-600 dark:text-green-400' };
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
                <button
                    onClick={onNavigateToCreateClient}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg 
                             hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Add Client
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search clients..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {search ? 'No clients match your search' : 'No clients yet. Add your first client!'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pharmacy</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days Left</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                                                {client.client_id}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                            {client.pharmacy_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                            {client.owner_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                            {client.city || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-medium rounded-full">
                                                {client.plans?.display_name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const remaining = getDaysRemaining(client.license_expires_at, client.plans?.name);
                                                return (
                                                    <span className={`text-sm font-medium ${remaining.color}`}>
                                                        {remaining.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(client.status)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => onNavigateToClientDetail(client.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 
                                                         hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
