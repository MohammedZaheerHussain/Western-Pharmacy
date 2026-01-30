/**
 * Weston Pharmacy - Medicine Inventory Management App
 * Main application with Inventory/Billing views and Dark Mode
 */

import { useState, useCallback, useEffect } from 'react';
import { useMedicines } from './hooks/useMedicines';
import { useBilling } from './hooks/useBilling';
import { Medicine, SortField, MedicineLocation, StockStatus, Bill } from './types/medicine';
import { MedicineFormData } from './components/MedicineModal';
import {
    SearchBar,
    FilterBar,
    AlertBanner,
    MedicineTable,
    MedicineModal,
    DeleteConfirmModal,
    BulkActionsBar,
    LocationModal,
    BillingPanel,
    SettingsModal,
    loadSettings,
    initializeSettingsFromUserMetadata,
    PharmacySettings,
    BackupModal
} from './components';
import { LoginPage } from './components/LoginPage';
import { AdminApp } from './pages/AdminApp';
import { syncService } from './services/syncService';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
import { InstallButton, InstallSuccessToast } from './components/InstallButton';
import { Plus, Package, Receipt, Sun, Moon, Settings, HardDrive, BarChart3, Truck, ShoppingCart, TrendingUp, ScanLine, Mail } from 'lucide-react';
import { Reports } from './pages/Reports';
import { Suppliers } from './pages/Suppliers';
import { Purchases } from './pages/Purchases';
import { AdvancedReports } from './pages/AdvancedReports';
import { StaffManagement } from './pages/StaffManagement';
import { ActivityLogs } from './pages/ActivityLogs';
import { BarcodeScanner } from './components/BarcodeScanner';
import { ExpiryAlertBanner } from './components/ExpiryAlertBanner';
import { getCurrentUser, signOut, onAuthStateChange, isAuthEnabled, AuthUser, isSuperAdmin, isEmailVerified } from './services/auth';
import { EmailVerificationGate } from './components/EmailVerificationGate';
import { SettlementModal } from './components/SettlementModal';
import { Settlement } from './types/user';
import { Users, ClipboardList, Calculator, Lock } from 'lucide-react';
import useFeatureAccess, { FeatureGate } from './hooks/useFeatureAccess';

type ViewMode = 'inventory' | 'billing' | 'reports' | 'suppliers' | 'purchases' | 'analytics' | 'staff' | 'activity';
type Theme = 'light' | 'dark' | 'system';

/** Get initial theme from localStorage or system preference */
function getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
    }
    return 'system';
}

/** Apply theme to document */
function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
    } else {
        root.classList.toggle('dark', theme === 'dark');
    }
}

/** Format number as Indian Rupees */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

function App() {
    const {
        medicines,
        allMedicines,
        loading,
        filters,
        setFilters,
        sort,
        setSort,
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        alerts,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        bulkDelete,
        bulkUpdateLocation,
        importMedicines,
        exportCSV,
        parseCSV,
        refreshMedicines
    } = useMedicines();

    const billing = useBilling();

    // View mode state
    const [viewMode, setViewMode] = useState<ViewMode>('inventory');

    // Theme state
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Modal states
    const [medicineModal, setMedicineModal] = useState<{ open: boolean; medicine: Medicine | null }>({
        open: false,
        medicine: null
    });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; medicine: Medicine | null; bulk: boolean }>({ open: false, medicine: null, bulk: false });
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [locationModal, setLocationModal] = useState<Medicine | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showInstallToast, setShowInstallToast] = useState(false);
    const [settingsModal, setSettingsModal] = useState(false);
    const [backupModal, setBackupModal] = useState(false);
    const [settings, setSettings] = useState<PharmacySettings>(loadSettings);
    const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
    const [settlementModal, setSettlementModal] = useState(false);

    // Feature access control based on plan
    const featureAccess = useFeatureAccess(settings);

    // Auth state
    const [user, setUser] = useState<AuthUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [emailVerified, setEmailVerified] = useState<boolean | null>(null); // null = checking

    // Initialize Sync Service
    useEffect(() => {
        // Get or create a persistent client ID for this device
        // In a real auth setup, this would come from the logged-in user
        let clientId = localStorage.getItem('device-client-id');
        if (!clientId) {
            clientId = crypto.randomUUID();
            localStorage.setItem('device-client-id', clientId);
        }

        syncService.initialize(clientId);

        return () => syncService.stop();
    }, []);

    // Apply theme on mount and changes
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Check auth on mount and listen for changes
    useEffect(() => {
        // If auth not enabled, skip auth check
        if (!isAuthEnabled()) {
            setAuthLoading(false);
            return;
        }

        // Check current session
        getCurrentUser().then(async u => {
            setUser(u);
            if (u) {
                // Check email verification status
                const verified = await isEmailVerified();
                setEmailVerified(verified);

                if (u.pharmacyName) {
                    // Initialize settings with pharmacy name
                    const newSettings = initializeSettingsFromUserMetadata(u.pharmacyName);
                    setSettings(newSettings);
                }
            }
            setAuthLoading(false);
        });

        // Listen for auth changes
        const { unsubscribe } = onAuthStateChange((u) => {
            setUser(u);
            if (u?.pharmacyName) {
                // Initialize settings with pharmacy name
                const newSettings = initializeSettingsFromUserMetadata(u.pharmacyName);
                setSettings(newSettings);
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut();
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                return;
            }

            // 'B' - Toggle billing
            if (e.key.toLowerCase() === 'b') {
                setViewMode(prev => prev === 'billing' ? 'inventory' : 'billing');
            }

            // 'D' - Toggle dark mode
            if (e.key.toLowerCase() === 'd') {
                setTheme(prev => prev === 'dark' ? 'light' : 'dark');
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    /** Toggle theme between light/dark */
    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            if (prev === 'system') {
                const isDark = document.documentElement.classList.contains('dark');
                return isDark ? 'light' : 'dark';
            }
            return prev === 'dark' ? 'light' : 'dark';
        });
    }, []);

    // Handle sort change
    const handleSort = useCallback((field: SortField) => {
        setSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, [setSort]);

    // Handle select all
    const handleSelectAll = useCallback(() => {
        const allIds = medicines.map(m => m.id);
        const allSelected = allIds.every(id => selectedIds.has(id));

        if (allSelected) {
            clearSelection();
        } else {
            selectAll(allIds);
        }
    }, [medicines, selectedIds, selectAll, clearSelection]);

    // Handle add/edit medicine
    const handleSaveMedicine = async (data: MedicineFormData) => {
        if (medicineModal.medicine) {
            await updateMedicine(medicineModal.medicine.id, data);
        } else {
            await addMedicine(data);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            if (deleteModal.bulk) {
                await bulkDelete(Array.from(selectedIds));
            } else if (deleteModal.medicine) {
                await deleteMedicine(deleteModal.medicine.id);
            }
            setDeleteModal({ open: false, medicine: null, bulk: false });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle bulk location update
    const handleBulkLocationUpdate = async (location: MedicineLocation) => {
        await bulkUpdateLocation(Array.from(selectedIds), location);
        clearSelection();
    };

    // Handle locate - highlight row and show location modal
    const handleLocate = useCallback((medicine: Medicine) => {
        setHighlightedId(medicine.id);
        setLocationModal(medicine);

        // Clear highlight after animation
        setTimeout(() => setHighlightedId(null), 2000);
    }, []);

    // Handle alert filter click
    const handleAlertFilter = useCallback((status: StockStatus | 'all') => {
        setFilters(prev => ({
            ...prev,
            stockStatus: prev.stockStatus === status ? 'all' : status
        }));
    }, [setFilters]);

    // Handle bill completion - refresh inventory
    const handleBillComplete = useCallback(() => {
        refreshMedicines();
    }, [refreshMedicines]);

    // Handle edit bill - load into billing
    const handleEditBill = useCallback((bill: Bill) => {
        setViewMode('billing');
        billing.loadBillForEdit(bill, allMedicines);
    }, [billing, allMedicines]);

    // Auth loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Login gate - show login page if auth is enabled and user not logged in
    if (isAuthEnabled() && !user) {
        return <LoginPage onLogin={async () => {
            const u = await getCurrentUser();
            setUser(u);
            if (u) {
                const verified = await isEmailVerified();
                setEmailVerified(verified);
            }
        }} />;
    }

    // Role-based routing - super admin sees admin dashboard
    if (isSuperAdmin(user)) {
        return <AdminApp user={user!} onLogout={() => setUser(null)} />;
    }

    // Email verification gate - block unverified clients
    if (isAuthEnabled() && user && emailVerified === false) {
        return (
            <EmailVerificationGate
                user={user}
                onVerified={() => setEmailVerified(true)}
                onLogout={() => {
                    setUser(null);
                    setEmailVerified(null);
                }}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky-header transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm p-1">
                                <img src="/billova-logo.png" alt="Billova" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Billova Medical</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.pharmacyName || 'Pharmacy Billing'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sync Status */}
                            <SyncStatusIndicator />

                            {/* Backup Button */}
                            <button
                                onClick={() => setBackupModal(true)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                                         rounded-lg transition-colors"
                                title="Backup Data"
                                aria-label="Backup Data"
                            >
                                <HardDrive size={20} />
                            </button>

                            {/* Settings Button */}
                            <button
                                onClick={() => setSettingsModal(true)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                                         rounded-lg transition-colors"
                                title="Settings"
                                aria-label="Settings"
                            >
                                <Settings size={20} />
                            </button>

                            {/* Feedback/Contact Button */}
                            <div className="relative group">
                                <button
                                    onClick={() => window.location.href = 'mailto:billovamedical@gmail.com?subject=Billova Medical Feedback&body=Hi Billova Team,%0D%0A%0D%0AI would like to share:%0D%0A%0D%0AType: [Feedback / Bug Report / Feature Idea]%0D%0A%0D%0ADetails:%0D%0A%0D%0A'}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600
                                             dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                                    title="Send Feedback"
                                    aria-label="Send Feedback"
                                >
                                    <Mail size={20} />
                                </button>
                                {/* Tooltip on hover */}
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Contact Us</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                        Share feedback, report issues, or suggest ideas!
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">billovamedical@gmail.com</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                                        📬 Queries resolved in 2-3 business days
                                    </p>
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                                         rounded-lg transition-colors"
                                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (D)`}
                                aria-label="Toggle theme"
                            >
                                {document.documentElement.classList.contains('dark') ? (
                                    <Sun size={20} />
                                ) : (
                                    <Moon size={20} />
                                )}
                            </button>

                            {/* PWA Install Button */}
                            <InstallButton onInstallSuccess={() => setShowInstallToast(true)} />

                            {/* Navigation Bar - Reorganized Layout */}
                            <div className="flex items-center gap-2">
                                {/* LEFT SIDE: Reports, Pro, Premium */}
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('reports')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                            ${viewMode === 'reports'
                                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                    >
                                        <BarChart3 size={16} />
                                        <span className="hidden sm:inline">Reports</span>
                                    </button>

                                    {/* Pro Features Dropdown */}
                                    <div className="relative group">
                                        <button
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                                bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm
                                                ${['suppliers', 'purchases', 'analytics'].includes(viewMode) ? 'ring-2 ring-amber-300' : ''}`}
                                        >
                                            <TrendingUp size={16} />
                                            <span className="hidden sm:inline">Pro</span>
                                        </button>
                                        <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                            <button
                                                onClick={() => featureAccess.canAccessSuppliers
                                                    ? setViewMode('suppliers')
                                                    : alert('Suppliers is a Pro feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg
                                                    ${!featureAccess.canAccessSuppliers ? 'opacity-60' : ''} 
                                                    ${viewMode === 'suppliers' ? 'text-medical-blue font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Truck size={14} />
                                                    Suppliers
                                                </span>
                                                {!featureAccess.canAccessSuppliers && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                        <Lock size={8} className="inline mr-0.5" />Pro
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => featureAccess.canAccessPurchases
                                                    ? setViewMode('purchases')
                                                    : alert('Purchases is a Pro feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                                                    ${!featureAccess.canAccessPurchases ? 'opacity-60' : ''} 
                                                    ${viewMode === 'purchases' ? 'text-medical-blue font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ShoppingCart size={14} />
                                                    Purchases
                                                </span>
                                                {!featureAccess.canAccessPurchases && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                        <Lock size={8} className="inline mr-0.5" />Pro
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => featureAccess.canAccessAdvancedReports
                                                    ? setViewMode('analytics')
                                                    : alert('Analytics is a Pro feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                                                    ${!featureAccess.canAccessAdvancedReports ? 'opacity-60' : ''} 
                                                    ${viewMode === 'analytics' ? 'text-medical-blue font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <TrendingUp size={14} />
                                                    Analytics
                                                </span>
                                                {!featureAccess.canAccessAdvancedReports && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                        <Lock size={8} className="inline mr-0.5" />Pro
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => featureAccess.canAccessBarcode
                                                    ? setBarcodeScannerOpen(true)
                                                    : alert('Barcode Scanner is a Pro feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg
                                                    ${!featureAccess.canAccessBarcode ? 'opacity-60' : ''} text-gray-700 dark:text-gray-300`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ScanLine size={14} />
                                                    Scan Barcode
                                                </span>
                                                {!featureAccess.canAccessBarcode && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                        <Lock size={8} className="inline mr-0.5" />Pro
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Premium Features Dropdown - Separate Purple Button */}
                                    <div className="relative group">
                                        <button
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                                bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm
                                                ${['staff', 'activity'].includes(viewMode) ? 'ring-2 ring-purple-300' : ''}`}
                                        >
                                            <Users size={16} />
                                            <span className="hidden sm:inline">Premium</span>
                                        </button>
                                        <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                            <button
                                                onClick={() => featureAccess.canAccessStaffManagement
                                                    ? setViewMode('staff')
                                                    : alert('Staff Management is a Premium feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg
                                                    ${!featureAccess.canAccessStaffManagement ? 'opacity-60' : ''} 
                                                    ${viewMode === 'staff' ? 'text-purple-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Users size={14} />
                                                    Staff
                                                </span>
                                                {!featureAccess.canAccessStaffManagement && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                                        <Lock size={8} className="inline mr-0.5" />Premium
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => featureAccess.canAccessActivityLogs
                                                    ? setViewMode('activity')
                                                    : alert('Activity Logs is a Premium feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                                                    ${!featureAccess.canAccessActivityLogs ? 'opacity-60' : ''} 
                                                    ${viewMode === 'activity' ? 'text-purple-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ClipboardList size={14} />
                                                    Activity Logs
                                                </span>
                                                {!featureAccess.canAccessActivityLogs && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                                        <Lock size={8} className="inline mr-0.5" />Premium
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => featureAccess.canAccessSettlement
                                                    ? setSettlementModal(true)
                                                    : alert('Settlement is a Premium feature. Upgrade your plan to access.')}
                                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg
                                                    ${!featureAccess.canAccessSettlement ? 'opacity-60' : ''} text-gray-700 dark:text-gray-300`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Calculator size={14} />
                                                    Settlement
                                                </span>
                                                {!featureAccess.canAccessSettlement && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                                        <Lock size={8} className="inline mr-0.5" />Premium
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDE: Inventory & Billing - Highlighted Primary Actions */}
                                <div className="flex bg-gradient-to-r from-medical-blue to-blue-600 rounded-lg p-1 shadow-sm">
                                    <button
                                        onClick={() => setViewMode('inventory')}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                                            ${viewMode === 'inventory'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <Package size={16} />
                                        <span className="hidden sm:inline">Inventory</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('billing')}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                                            ${viewMode === 'billing'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <Receipt size={16} />
                                        <span className="hidden sm:inline">Billing</span>
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'inventory' && (
                                <>
                                    <button
                                        onClick={() => setMedicineModal({ open: true, medicine: null })}
                                        className="flex items-center gap-2 px-4 py-2 bg-medical-blue text-white 
                                   rounded-lg hover:bg-medical-blue-dark transition-colors font-medium"
                                    >
                                        <Plus size={20} />
                                        <span className="hidden sm:inline">Add Medicine</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - only in inventory mode */}
                    {viewMode === 'inventory' && (
                        <SearchBar
                            value={filters.search}
                            onChange={(search) => setFilters(prev => ({ ...prev, search }))}
                        />
                    )}
                </div>
            </header>

            {/* Expiry Alert Banner - Notification Bar Area Below Header */}
            {!['reports', 'analytics'].includes(viewMode) && (
                <ExpiryAlertBanner onViewReport={() => setViewMode('reports')} />
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                {viewMode === 'inventory' ? (
                    <>
                        {/* Alerts */}
                        <AlertBanner
                            lowStockCount={alerts.lowStock}
                            expiringCount={alerts.expiringSoon}
                            outOfStockCount={alerts.outOfStock}
                            onFilter={handleAlertFilter}
                            currentFilter={filters.stockStatus}
                        />

                        {/* Filters */}
                        <FilterBar
                            filters={filters}
                            onChange={setFilters}
                        />

                        {/* Medicine Table */}
                        <MedicineTable
                            medicines={medicines}
                            sort={sort}
                            onSort={handleSort}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onSelectAll={handleSelectAll}
                            onEdit={(medicine) => setMedicineModal({ open: true, medicine })}
                            onDelete={(medicine) => setDeleteModal({ open: true, medicine, bulk: false })}
                            onLocate={handleLocate}
                            highlightedId={highlightedId}
                        />

                        {/* Bulk Actions Bar */}
                        <BulkActionsBar
                            selectedCount={selectedIds.size}
                            onDelete={() => setDeleteModal({ open: true, medicine: null, bulk: true })}
                            onUpdateLocation={handleBulkLocationUpdate}
                            onClear={clearSelection}
                        />
                    </>
                ) : viewMode === 'billing' ? (
                    /* Billing View */
                    /* Billing View */
                    <BillingPanel
                        medicines={allMedicines}
                        cart={billing.cart}
                        discountPercent={billing.discountPercent}
                        subtotal={billing.subtotal}
                        discountAmount={billing.discountAmount}
                        grandTotal={billing.grandTotal}
                        customerName={billing.customerName}
                        customerPhone={billing.customerPhone}
                        doctorName={billing.doctorName}
                        bills={billing.bills}
                        error={billing.error}
                        successMessage={billing.successMessage}
                        loading={billing.loading}
                        editingBill={billing.editingBill}
                        isEditMode={billing.isEditMode}
                        gstEnabled={settings.gstEnabled}
                        gstPercentage={settings.gstPercentage}
                        onAddToCart={billing.addToCart}
                        onRemoveFromCart={billing.removeFromCart}
                        onUpdateQuantity={billing.updateCartQuantity}
                        onUpdateStripLooseQty={billing.updateStripLooseQty}
                        onClearCart={billing.clearCart}
                        onSetDiscount={billing.setDiscount}
                        onSetCustomerName={billing.setCustomerName}
                        onSetCustomerPhone={billing.setCustomerPhone}
                        onSetDoctorName={billing.setDoctorName}
                        onConfirmBill={billing.confirmBill}
                        onLoadBills={billing.loadBills}
                        onExportBills={billing.exportBills}
                        onClearError={billing.clearError}
                        onClearSuccess={billing.clearSuccess}
                        onBillComplete={handleBillComplete}
                        onEditBill={handleEditBill}
                        onCancelEdit={billing.cancelEdit}
                    />
                ) : viewMode === 'suppliers' ? (
                    /* Suppliers View */
                    <FeatureGate
                        hasAccess={featureAccess.canAccessSuppliers}
                        feature="Suppliers"
                        requiredPlan="pro"
                        showPreview
                    >
                        <Suppliers formatCurrency={formatCurrency} />
                    </FeatureGate>
                ) : viewMode === 'purchases' ? (
                    /* Purchases View */
                    <FeatureGate
                        hasAccess={featureAccess.canAccessPurchases}
                        feature="Purchases"
                        requiredPlan="pro"
                        showPreview
                    >
                        <Purchases
                            formatCurrency={formatCurrency}
                            onNavigateToSuppliers={() => setViewMode('suppliers')}
                        />
                    </FeatureGate>
                ) : viewMode === 'analytics' ? (
                    /* Advanced Analytics View */
                    <FeatureGate
                        hasAccess={featureAccess.canAccessAdvancedReports}
                        feature="Advanced Analytics"
                        requiredPlan="pro"
                        showPreview
                    >
                        <AdvancedReports settings={settings} formatCurrency={formatCurrency} />
                    </FeatureGate>
                ) : viewMode === 'staff' ? (
                    /* Staff Management View */
                    <FeatureGate
                        hasAccess={featureAccess.canAccessStaffManagement}
                        feature="Staff Management"
                        requiredPlan="premium"
                        showPreview
                    >
                        <StaffManagement />
                    </FeatureGate>
                ) : viewMode === 'activity' ? (
                    /* Activity Logs View */
                    <FeatureGate
                        hasAccess={featureAccess.canAccessActivityLogs}
                        feature="Activity Logs"
                        requiredPlan="premium"
                        showPreview
                    >
                        <ActivityLogs />
                    </FeatureGate>
                ) : (
                    /* Reports View */
                    <Reports
                        settings={settings}
                        formatCurrency={formatCurrency}
                    />
                )}
            </main>

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={barcodeScannerOpen}
                onClose={() => setBarcodeScannerOpen(false)}
                onScan={(barcode) => {
                    // Search for medicine by barcode
                    const medicine = allMedicines.find(m => m.barcode === barcode);

                    if (medicine) {
                        // Switch to billing view and add to cart
                        setViewMode('billing');
                        billing.addToCart(medicine, 1); // Add 1 strip by default
                        setBarcodeScannerOpen(false);
                    } else {
                        // Medicine not found - show alert
                        alert(`No medicine found with barcode: ${barcode}\n\nPlease add the barcode to the medicine in inventory first.`);
                    }
                }}
            />

            {/* Modals */}
            <MedicineModal
                isOpen={medicineModal.open}
                medicine={medicineModal.medicine}
                onClose={() => setMedicineModal({ open: false, medicine: null })}
                onSave={handleSaveMedicine}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.open}
                title={deleteModal.bulk ? 'Delete Selected Medicines' : 'Delete Medicine'}
                message={
                    deleteModal.bulk
                        ? `Are you sure you want to delete ${selectedIds.size} selected medicines?`
                        : `Are you sure you want to delete "${deleteModal.medicine?.name}"?`
                }
                itemCount={deleteModal.bulk ? selectedIds.size : undefined}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ open: false, medicine: null, bulk: false })}
                loading={actionLoading}
            />

            <LocationModal
                medicine={locationModal}
                onClose={() => setLocationModal(null)}
            />

            {/* PWA Install Success Toast */}
            <InstallSuccessToast
                show={showInstallToast}
                onClose={() => setShowInstallToast(false)}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={settingsModal}
                settings={settings}
                onClose={() => setSettingsModal(false)}
                onSave={setSettings}
                onExportCSV={exportCSV}
                onImportCSV={importMedicines}
                parseCSV={parseCSV}
                onLogout={handleLogout}
                isAuthEnabled={isAuthEnabled()}
            />

            {/* Backup Modal */}
            <BackupModal
                isOpen={backupModal}
                onClose={() => setBackupModal(false)}
                onBackupComplete={() => { }}
                onRestoreComplete={refreshMedicines}
            />

            {/* Settlement Modal */}
            <SettlementModal
                isOpen={settlementModal}
                onClose={() => setSettlementModal(false)}
                onComplete={async (settlement: Settlement) => {
                    console.log('Settlement completed:', settlement);
                    // TODO: Save settlement to IndexedDB
                    setSettlementModal(false);
                }}
                currentUserName={user?.email?.split('@')[0] || 'Owner'}
                formatCurrency={formatCurrency}
            />
        </div>
    );
}

export default App;
