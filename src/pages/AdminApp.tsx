/**
 * AdminApp - Admin Dashboard for Super Admins
 * Manages clients, licenses, and analytics
 */

import { useState } from 'react';
import { LayoutDashboard, Users, Plus, LogOut, ChevronLeft } from 'lucide-react';
import { AuthUser, signOut } from '../services/auth';
import Dashboard from './admin/Dashboard';
import Clients from './admin/Clients';
import CreateClient from './admin/CreateClient';
import ClientDetail from './admin/ClientDetail';

type AdminView = 'dashboard' | 'clients' | 'create-client' | 'client-detail';

interface AdminAppProps {
    user: AuthUser;
    onLogout: () => void;
}

export function AdminApp({ user, onLogout }: AdminAppProps) {
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const handleLogout = async () => {
        try {
            await signOut();
            onLogout();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const navigateToClients = () => setCurrentView('clients');
    const navigateToCreateClient = () => setCurrentView('create-client');
    const navigateToClientDetail = (clientId: string) => {
        setSelectedClientId(clientId);
        setCurrentView('client-detail');
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <Dashboard
                        onNavigateToClients={navigateToClients}
                        onNavigateToCreateClient={navigateToCreateClient}
                    />
                );
            case 'clients':
                return (
                    <Clients
                        onNavigateToCreateClient={navigateToCreateClient}
                        onNavigateToClientDetail={navigateToClientDetail}
                    />
                );
            case 'create-client':
                return (
                    <CreateClient
                        onBack={navigateToClients}
                        onSuccess={navigateToClients}
                    />
                );
            case 'client-detail':
                return selectedClientId ? (
                    <ClientDetail
                        clientId={selectedClientId}
                        onBack={navigateToClients}
                    />
                ) : null;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Admin Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Back button for sub-pages */}
                            {currentView !== 'dashboard' && (
                                <button
                                    onClick={() => currentView === 'client-detail' ? navigateToClients() : setCurrentView('dashboard')}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                                             dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                    <LayoutDashboard className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Billova Admin
                                    </h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Quick actions */}
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={`p-2 rounded-lg transition-colors ${currentView === 'dashboard'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                title="Dashboard"
                            >
                                <LayoutDashboard size={20} />
                            </button>

                            <button
                                onClick={navigateToClients}
                                className={`p-2 rounded-lg transition-colors ${currentView === 'clients' || currentView === 'client-detail'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                title="Clients"
                            >
                                <Users size={20} />
                            </button>

                            <button
                                onClick={navigateToCreateClient}
                                className={`p-2 rounded-lg transition-colors ${currentView === 'create-client'
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                title="Add Client"
                            >
                                <Plus size={20} />
                            </button>

                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600
                                         dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Admin Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {renderView()}
            </main>
        </div>
    );
}

export default AdminApp;
